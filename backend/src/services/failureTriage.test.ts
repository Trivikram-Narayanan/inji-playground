import { test } from 'node:test';
import assert from 'node:assert/strict';
import { triageFailure } from './failureTriage';

test('triageFailure degrades to the heuristic classifier when no ANTHROPIC_API_KEY is set', async () => {
  const original = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const result = await triageFailure({ errorMessage: 'unsupported_credential_type', context: { format: 'mdoc' } });
    assert.equal(result.source, 'heuristic');
    assert.equal(result.errorCode, 'FORMAT_MISMATCH');
    assert.equal(result.explanation, 'unsupported_credential_type');
  } finally {
    if (original) process.env.ANTHROPIC_API_KEY = original;
  }
});
