import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySandboxError } from './errorCodes';

test('classifySandboxError maps proof-related messages to PROOF_TYPE_UNSUPPORTED', () => {
  assert.equal(classifySandboxError('Invalid proof provided'), 'PROOF_TYPE_UNSUPPORTED');
});

test('classifySandboxError maps format/credential_configuration messages to FORMAT_MISMATCH', () => {
  assert.equal(classifySandboxError('unsupported_credential_type'), 'FORMAT_MISMATCH');
  assert.equal(classifySandboxError('invalid credential_configuration_id'), 'FORMAT_MISMATCH');
});

test('classifySandboxError falls back to UNKNOWN_ERROR for unrecognized messages', () => {
  assert.equal(classifySandboxError('something went sideways'), 'UNKNOWN_ERROR');
});
