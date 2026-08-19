import { Injectable } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOllama } from '@langchain/ollama';

const textContent = (content: unknown): string => typeof content === 'string' ? content : JSON.stringify(content);

@Injectable()
export class LlmService {
  private readonly model = new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: process.env.OLLAMA_CHAT_MODEL ?? 'llama3.1:8b',
    temperature: 0.1,
  });

  async classifyIntent(message: string): Promise<'intake' | 'support'> {
    // LangChain owns the prompt/model pipeline; callers do not depend on Ollama directly.
    const chain = RunnableSequence.from([
      ChatPromptTemplate.fromTemplate('Classify this customer message as exactly intake or support. Intake means starting or continuing a domain transfer. Everything else is support. Message: {message}'),
      this.model,
    ]);
    const output = await chain.invoke({ message });
    return /intake/i.test(textContent(output.content)) ? 'intake' : 'support';
  }

  async answerWithContext(question: string, context: string): Promise<string> {
    const chain = RunnableSequence.from([
      ChatPromptTemplate.fromMessages([
        ['system', 'You are a concise customer-support assistant for a small-business web-services company. Answer only from the supplied knowledge-base matches. Do not invent company-specific policies, links, phone numbers, or actions. If details are placeholders, say the exact steps can vary by account.'],
        ['human', 'Knowledge-base matches:\n{context}\n\nCustomer question: {question}\n\nGive a friendly, direct answer grounded in the matches.'],
      ]),
      this.model,
    ]);
    const output = await chain.invoke({ question, context });
    return textContent(output.content).trim();
  }
}
