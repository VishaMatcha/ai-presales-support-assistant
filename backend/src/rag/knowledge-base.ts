import type { RagMatch } from '../assistant/chat.types.js';

export interface KnowledgeBase {
  readonly name: string;
  search(query: string, limit?: number): Promise<RagMatch[]>;
}
