import { Inject, Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service.js';
import type { ChatMode, SessionState } from './chat.types.js';

const TRANSFER_ACTION = /\b(transfer|move|migrate|bring)\b/i;
const DOMAIN_REFERENCE = /\bdomain\b|\bwebsite address\b|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/i;
const SUPPORT_TERMS = /\b(reset|password|refund|invoice|payment|order|delivery|account|cancel|contact|support|help)\b/i;

@Injectable()
export class IntentRouterService {
  constructor(@Inject(LlmService) private readonly llm: LlmService) {}

  async route(message: string, session: SessionState): Promise<ChatMode> {
    // Active slot filling is sticky so a short reply such as “yes” reaches the pending field.
    if (session.intake.active) return 'intake';
    if (TRANSFER_ACTION.test(message) && DOMAIN_REFERENCE.test(message)) return 'intake';
    if (SUPPORT_TERMS.test(message)) return 'support';
    try {
      return await this.llm.classifyIntent(message);
    } catch {
      // Local services may still be starting. Support is the least surprising safe fallback.
      return 'support';
    }
  }
}
