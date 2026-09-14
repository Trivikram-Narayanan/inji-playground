import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sdJwt from './sdJwt';

test('sd-jwt: issue then verify succeeds', async () => {
  const { sdJwt: token } = await sdJwt.issue({ fullName: 'Jane Doe' });
  const outcome = await sdJwt.verify(token);
  assert.equal(outcome.valid, true);
  assert.equal(outcome.errorCode, null);
});

test('sd-jwt: bad-signature tamper is rejected as SIGNATURE_INVALID', async () => {
  const { sdJwt: token } = await sdJwt.issue({ fullName: 'Jane Doe' });
  const tampered = sdJwt.tamper(token, 'bad-signature');
  const outcome = await sdJwt.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'SIGNATURE_INVALID');
});

test('sd-jwt: claim-corruption tamper is rejected as CLAIM_MISMATCH (signature still valid)', async () => {
  const { sdJwt: token } = await sdJwt.issue({ fullName: 'Jane Doe' });
  const tampered = sdJwt.tamper(token, 'claim-corruption');
  const outcome = await sdJwt.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'CLAIM_MISMATCH');
  assert.equal(outcome.checks.signature, true);
});

test('sd-jwt: expired tamper is rejected as CREDENTIAL_EXPIRED', async () => {
  const { sdJwt: token } = await sdJwt.issue({ fullName: 'Jane Doe' });
  const tampered = sdJwt.tamper(token, 'expired');
  const outcome = await sdJwt.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'CREDENTIAL_EXPIRED');
});
