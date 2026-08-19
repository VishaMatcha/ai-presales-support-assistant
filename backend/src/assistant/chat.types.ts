import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export type ChatMode = 'intake' | 'support';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4_000)
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8_000)
  message!: string;
}

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
  structuredSummary?: DomainTransferData;
}

export interface DomainTransferData {
  domainName: string;
  currentProvider: string;
  eppCode: string;
  domainUnlocked: boolean;
  adminEmailAccess: boolean;
  domainAgeEligible: boolean;
  whoisPrivacyStatus: 'enabled' | 'disabled' | 'unsure';
}

export interface IntakeState {
  active: boolean;
  slots: Partial<DomainTransferData>;
  pendingField?: keyof DomainTransferData;
}

export interface SessionState {
  intake: IntakeState;
  lastMode?: ChatMode;
  updatedAt: number;
}
