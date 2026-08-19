import { Inject, Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service.js';
import { KnowledgeBaseRegistry } from '../rag/knowledge-base.registry.js';
import type { ChatResponse } from './chat.types.js';

@Injectable()
export class SupportService {
  private readonly threshold = Number(process.env.RAG_SCORE_THRESHOLD ?? 0.58);

  constructor(
    @Inject(KnowledgeBaseRegistry) private readonly registry: KnowledgeBaseRegistry,
    @Inject(LlmService) private readonly llm: LlmService,
  ) {}

  async answer(sessionId: string, question: string): Promise<ChatResponse> {
    try {
      const matches = await this.registry.get().search(question, 4);
      const goodMatches = matches.filter((match) => match.score >= this.threshold);
      if (goodMatches.length === 0) {
        return {
          sessionId,
          mode: 'support',
          message: 'I couldn’t find a strong match in the support knowledge base, and I don’t want to guess. Would you like me to connect you with a human agent?',
          matches,
        };
      }
      const context = goodMatches.map((match, index) => `[${index + 1}] Question: ${match.instruction}\nAnswer: ${match.response}\nCategory: ${match.category ?? 'n/a'}; Intent: ${match.intent ?? 'n/a'}`).join('\n\n');
      const answer = await this.llm.answerWithContext(question, context);
      return { sessionId, mode: 'support', message: answer, matches };
    } catch {
      return {
        sessionId,
        mode: 'support',
        message: 'The local knowledge-base services are not ready yet. Start Ollama and Qdrant, then run the ingestion seed. I can connect you with a human agent in the meantime.',
      };
    }
  }
}
