import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as ldpVc from './ldpVc';

test('ldp_vc: issue then verify succeeds', async () => {
  const { credential } = await ldpVc.issue({ fullName: 'Jane Doe' });
  const outcome = await ldpVc.verify(credential);
  assert.equal(outcome.valid, true);
  assert.equal(outcome.errorCode, null);
});

test('ldp_vc: bad-signature tamper is rejected as SIGNATURE_INVALID', async () => {
  const { credential } = await ldpVc.issue({ fullName: 'Jane Doe' });
  const tampered = ldpVc.tamper(credential, 'bad-signature');
  const outcome = await ldpVc.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'SIGNATURE_INVALID');
});

test('ldp_vc: claim-corruption tamper also breaks the JSON-LD signature (no digest/value separation, unlike sd-jwt/mdoc)', async () => {
  const { credential } = await ldpVc.issue({ fullName: 'Jane Doe' });
  const tampered = ldpVc.tamper(credential, 'claim-corruption');
  const outcome = await ldpVc.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'SIGNATURE_INVALID');
});

test('ldp_vc: expired tamper is rejected as CREDENTIAL_EXPIRED', async () => {
  const { credential } = await ldpVc.issue({ fullName: 'Jane Doe' });
  const tampered = ldpVc.tamper(credential, 'expired');
  const outcome = await ldpVc.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'CREDENTIAL_EXPIRED');
});
