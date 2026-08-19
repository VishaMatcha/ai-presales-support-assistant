import { Injectable } from '@nestjs/common';
import { OllamaEmbeddings } from '@langchain/ollama';

@Injectable()
export class EmbeddingService {
  private readonly embeddings = new OllamaEmbeddings({
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
  });

  embedQuery(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }
}
