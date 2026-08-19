import { Injectable } from '@nestjs/common';
import { DOMAIN_TRANSFER_REQUIREMENTS, requirementFor } from './domain-transfer.schema.js';
import type { ChatResponse, DomainTransferData, SessionState } from './chat.types.js';

const EXPLANATION_REQUEST = /^(what|why|where|how|explain|i don'?t understand|what does)/i;

@Injectable()
export class IntakeService {
  handle(sessionId: string, message: string, session: SessionState): ChatResponse {
    const state = session.intake;

    if (/\b(cancel|stop|start over)\b.*\b(transfer|intake|this)\b/i.test(message)) {
      session.intake = { active: false, slots: {} };
      return { sessionId, mode: 'intake', message: 'No problem — I cleared the domain-transfer intake. Ask me a support question or say when you want to start again.' };
    }

    if (!state.active) {
      state.active = true;
      const discoveredDomain = message.match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/i)?.[0];
      if (discoveredDomain) state.slots.domainName = discoveredDomain.toLowerCase();
    } else if (state.pendingField && EXPLANATION_REQUEST.test(message.trim())) {
      const field = requirementFor(state.pendingField);
      return this.response(sessionId, session, `${field.description}\n\nWhy we need it: ${field.why}\n\nWhere to find it: ${field.whereToFind}\n\n${field.question}`);
    } else if (state.pendingField) {
      const field = requirementFor(state.pendingField);
      const result = field.validate(message);
      if (!result.ok) return this.response(sessionId, session, `${result.error}\n\n${field.question}`);
      (state.slots as Record<string, unknown>)[field.name] = result.value;
      state.pendingField = undefined;
    }

    const next = DOMAIN_TRANSFER_REQUIREMENTS.find((field) => state.slots[field.name] === undefined);
    if (next) {
      state.pendingField = next.name;
      const prefix = Object.keys(state.slots).length === 0
        ? 'I can help with that. I’ll collect the transfer details one at a time and explain anything that is unfamiliar.\n\n'
        : 'Got it. ';
      return this.response(sessionId, session, `${prefix}${next.question}`);
    }

    state.active = false;
    state.pendingField = undefined;
    const summary = state.slots as DomainTransferData;
    const eligibilityNote = summary.domainUnlocked && summary.adminEmailAccess && summary.domainAgeEligible
      ? 'The prerequisites you confirmed look ready for provisioning review.'
      : 'One or more prerequisites still need attention before provisioning can begin.';
    return {
      ...this.response(sessionId, session, `Thanks — the intake is complete. ${eligibilityNote} The engineering-ready JSON is shown below; the authorization code is sensitive, so share it only through an approved secure channel.`),
      completed: true,
      structuredSummary: summary,
    };
  }

  private response(sessionId: string, session: SessionState, message: string): ChatResponse {
    const collected = DOMAIN_TRANSFER_REQUIREMENTS.filter((field) => session.intake.slots[field.name] !== undefined).map((field) => field.name);
    const missing = DOMAIN_TRANSFER_REQUIREMENTS.filter((field) => session.intake.slots[field.name] === undefined).map((field) => field.name);
    return { sessionId, mode: 'intake', message, intake: { collected, missing, progress: Math.round((collected.length / DOMAIN_TRANSFER_REQUIREMENTS.length) * 100) } };
  }
}
