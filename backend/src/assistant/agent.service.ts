import { Inject, Injectable } from '@nestjs/common';
import type { ChatResponse } from './chat.types.js';
import { IntakeService } from './intake.service.js';
import { IntentRouterService } from './intent-router.service.js';
import { SessionService } from './session.service.js';
import { SupportService } from './support.service.js';

@Injectable()
export class AgentService {
  constructor(
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(IntentRouterService) private readonly router: IntentRouterService,
    @Inject(IntakeService) private readonly intake: IntakeService,
    @Inject(SupportService) private readonly support: SupportService,
  ) {}

  async handle(sessionId: string, message: string): Promise<ChatResponse> {
    const session = this.sessions.get(sessionId);
    const mode = await this.router.route(message, session);
    session.lastMode = mode;
    // The agent loop routes to one focused tool. Intake mutates slot state; support is read-only RAG.
    return mode === 'intake'
      ? this.intake.handle(sessionId, message, session)
      : this.support.answer(sessionId, message);
  }
}
