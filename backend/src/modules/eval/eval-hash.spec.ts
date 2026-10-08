import { hashValue, evidenceText } from './eval-hash';
describe('eval persisted hashes and literal evidence', () => {
  test('hash survives JSONB serialization of omitted optional properties', () => {
    const artifact = {
      kind: 'compilation',
      content: 'Generated lesson',
      conceptRefs: undefined,
      mcqs: [],
    };
    expect(hashValue(artifact)).toBe(
      hashValue(JSON.parse(JSON.stringify(artifact))),
    );
  });
  test('evidence includes generated prose and item text, not stage labels or verifier conclusions', () => {
    const text = evidenceText({
      kind: 'compilation',
      content: 'Generated lesson\nLiteral quote',
      stages: [{ stage: 'INTERNAL_STAGE', ok: true }],
      mcqs: [
        {
          questionText: 'Generated stem',
          verificationResult: { reason: 'VERIFIER_CLAIM' },
          options: [{ optionText: 'Generated option' }],
        },
      ],
    });
    expect(text).toContain('Generated lesson\nLiteral quote');
    expect(text).toContain('Generated stem');
    expect(text).toContain('Generated option');
    expect(text).not.toContain('compilation');
    expect(text).not.toContain('INTERNAL_STAGE');
    expect(text).not.toContain('VERIFIER_CLAIM');
  });
});
