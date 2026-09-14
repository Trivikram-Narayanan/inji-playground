import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mdoc from './mdoc';

test('mdoc: issue then verify succeeds', async () => {
  const { mdocBase64 } = await mdoc.issue({ given_name: 'Jane' });
  const outcome = await mdoc.verify(mdocBase64);
  assert.equal(outcome.valid, true);
  assert.equal(outcome.errorCode, null);
});

test('mdoc: bad-signature tamper is rejected as SIGNATURE_INVALID', async () => {
  const { mdocBase64 } = await mdoc.issue({ given_name: 'Jane' });
  const tampered = await mdoc.tamper(mdocBase64, 'bad-signature');
  const outcome = await mdoc.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'SIGNATURE_INVALID');
});

test('mdoc: claim-corruption tamper is rejected as CLAIM_MISMATCH while COSE signature still verifies', async () => {
  const { mdocBase64 } = await mdoc.issue({ given_name: 'Jane' });
  const tampered = await mdoc.tamper(mdocBase64, 'claim-corruption');
  const outcome = await mdoc.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'CLAIM_MISMATCH');
  assert.equal(outcome.checks.signature, true);
});

test('mdoc: expired tamper is rejected as CREDENTIAL_EXPIRED', async () => {
  const { mdocBase64 } = await mdoc.issue({ given_name: 'Jane' });
  const tampered = await mdoc.tamper(mdocBase64, 'expired');
  const outcome = await mdoc.verify(tampered);
  assert.equal(outcome.valid, false);
  assert.equal(outcome.errorCode, 'CREDENTIAL_EXPIRED');
});
