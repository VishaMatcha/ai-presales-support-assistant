export type ChatMode = 'intake' | 'support';

export interface RagMatch {
  id: string | number;
  score: number;
  instruction: string;
  response: string;
  category?: string;
  intent?: string;
}

export interface ChatResponse {
  sessionId: string;
  mode: ChatMode;
  message: string;
  matches?: RagMatch[];
  intake?: { collected: string[]; missing: string[]; progress: number };
  completed?: boolean;
  structuredSummary?: Record<string, string | boolean>;
}

export interface ChatMessage extends Partial<ChatResponse> {
  id: string;
  role: 'assistant' | 'user';
  message: string;
}
