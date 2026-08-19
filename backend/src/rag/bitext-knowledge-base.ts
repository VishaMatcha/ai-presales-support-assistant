import { Inject, Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { RagMatch } from '../assistant/chat.types.js';
import { EmbeddingService } from './embedding.service.js';
import type { KnowledgeBase } from './knowledge-base.js';

@Injectable()
export class BitextKnowledgeBase implements KnowledgeBase {
  readonly name = 'bitext-support';
  private readonly client = new QdrantClient({ url: process.env.QDRANT_URL ?? 'http://localhost:6333', checkCompatibility: false });
  private readonly collection = process.env.QDRANT_COLLECTION ?? 'bitext_support';

  constructor(@Inject(EmbeddingService) private readonly embeddings: EmbeddingService) {}

  async search(query: string, limit = 4): Promise<RagMatch[]> {
    const vector = await this.embeddings.embedQuery(query);
    const { points } = await this.client.query(this.collection, { query: vector, limit, with_payload: true });
    return points.map((result) => {
      const payload = result.payload ?? {};
      return {
        id: result.id,
        score: result.score,
        instruction: String(payload.instruction ?? ''),
        response: String(payload.response ?? ''),
        category: payload.category ? String(payload.category) : undefined,
        intent: payload.intent ? String(payload.intent) : undefined,
      };
    });
  }
}
