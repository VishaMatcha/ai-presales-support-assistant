import { IntentRouterService } from '../src/assistant/intent-router.service';
import type { SessionState } from '../src/assistant/chat.types';
import type { LlmService } from '../src/llm/llm.service';

describe('IntentRouterService', () => {
  const llm = { classifyIntent: jest.fn().mockResolvedValue('support') } as unknown as LlmService;
  const router = new IntentRouterService(llm);
  const session: SessionState = { intake: { active: false, slots: {} }, updatedAt: Date.now() };

  it('routes a transfer containing a real domain name without calling the LLM', async () => {
    await expect(router.route('I want to transfer example.com', session)).resolves.toBe('intake');
    expect(llm.classifyIntent).not.toHaveBeenCalled();
  });

  it('keeps short slot replies inside an active intake', async () => {
    await expect(router.route('yes', { ...session, intake: { active: true, slots: {} } })).resolves.toBe('intake');
  });
});
