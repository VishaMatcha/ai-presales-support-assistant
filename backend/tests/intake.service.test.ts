import { IntakeService } from '../src/assistant/intake.service';
import type { SessionState } from '../src/assistant/chat.types';

describe('IntakeService', () => {
  it('discovers a domain and asks for the next missing field', () => {
    const service = new IntakeService();
    const session: SessionState = { intake: { active: false, slots: {} }, updatedAt: Date.now() };
    const response = service.handle('s1', 'I want to transfer example.com', session);
    expect(session.intake.slots.domainName).toBe('example.com');
    expect(session.intake.pendingField).toBe('currentProvider');
    expect(response.intake?.progress).toBe(14);
  });

  it('explains a pending field without consuming it', () => {
    const service = new IntakeService();
    const session: SessionState = { intake: { active: true, slots: { domainName: 'example.com' }, pendingField: 'eppCode' }, updatedAt: Date.now() };
    const response = service.handle('s1', 'what does that mean?', session);
    expect(response.message).toContain('authorization code');
    expect(session.intake.slots.eppCode).toBeUndefined();
  });
});
