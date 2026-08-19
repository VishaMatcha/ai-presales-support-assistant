import { Injectable } from '@nestjs/common';
import type { SessionState } from './chat.types.js';

const SESSION_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, SessionState>();

  get(sessionId: string): SessionState {
    const existing = this.sessions.get(sessionId);
    if (existing && Date.now() - existing.updatedAt < SESSION_TTL_MS) {
      existing.updatedAt = Date.now();
      return existing;
    }
    const created: SessionState = { intake: { active: false, slots: {} }, updatedAt: Date.now() };
    this.sessions.set(sessionId, created);
    return created;
  }

  resetIntake(sessionId: string): void {
    const session = this.get(sessionId);
    session.intake = { active: false, slots: {} };
  }
}
