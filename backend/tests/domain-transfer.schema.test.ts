import { requirementFor } from '../src/assistant/domain-transfer.schema';

describe('domain transfer requirements', () => {
  it('normalizes a valid domain', () => {
    expect(requirementFor('domainName').validate('https://Example.com/path')).toEqual({ ok: true, value: 'example.com' });
  });

  it('rejects a malformed domain', () => {
    expect(requirementFor('domainName').validate('not a domain').ok).toBe(false);
  });

  it('accepts plain-language boolean confirmations', () => {
    expect(requirementFor('domainUnlocked').validate('yes, it is unlocked')).toEqual({ ok: true, value: true });
    expect(requirementFor('adminEmailAccess').validate('no, not yet')).toEqual({ ok: true, value: false });
  });
});
