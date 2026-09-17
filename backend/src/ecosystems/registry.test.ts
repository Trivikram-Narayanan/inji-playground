import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEcosystem, checkDidMethodTrust, ECOSYSTEM_REGISTRY } from './registry';

test('getEcosystem maps known MOSIP actors to the mosip ecosystem', () => {
  for (const actor of ['inji-certify', 'inji-wallet-mobile', 'inji-web', 'inji-verify']) {
    assert.equal(getEcosystem(actor).id, 'mosip');
  }
});

test('getEcosystem maps external-mock to the reference ecosystem', () => {
  assert.equal(getEcosystem('external-mock').id, 'reference');
});

test('getEcosystem defaults unknown actors to mosip', () => {
  assert.equal(getEcosystem('some-unregistered-actor').id, 'mosip');
});

test('checkDidMethodTrust: same-ecosystem issuer/verifier pairs are trusted', () => {
  const result = checkDidMethodTrust('inji-certify', 'inji-verify');
  assert.equal(result.trusted, true);
});

test('checkDidMethodTrust: reference-ecosystem issuer is not trusted by a mosip verifier', () => {
  const result = checkDidMethodTrust('external-mock', 'inji-verify');
  assert.equal(result.trusted, false);
  assert.equal(result.issuerEcosystem.id, 'reference');
  assert.equal(result.verifierEcosystem.id, 'mosip');
});

test('checkDidMethodTrust: mosip issuer is not trusted by the reference-ecosystem verifier either (mismatch is symmetric)', () => {
  const result = checkDidMethodTrust('inji-certify', 'external-mock');
  assert.equal(result.trusted, false);
});

test('every ecosystem trusts its own issuer DID method (self-consistency of the registry)', () => {
  for (const eco of Object.values(ECOSYSTEM_REGISTRY)) {
    assert.ok(eco.trustedIssuerDidMethods.includes(eco.issuerDidMethod), `${eco.id} should trust its own issuer DID method`);
  }
});
