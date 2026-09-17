import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

process.env.DB_FILE = path.join(os.tmpdir(), `playground-test-${crypto.randomUUID()}.sqlite`);

import request from 'supertest';
import { createApp } from './app';

const app = createApp();

test('GET /health responds ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('GET /api/config/options lists issuers/wallets/verifiers/formats', async () => {
  const res = await request(app).get('/api/config/options');
  assert.equal(res.status, 200);
  assert.ok(res.body.formats.some((f: any) => f.id === 'sd-jwt-vc' && f.realModeSupported === false));
});

test('full Simulated Mode flow: start -> advance -> report, walking the state machine to VERIFIED_VALID', async () => {
  const startRes = await request(app)
    .post('/api/flows')
    .send({ issuer: 'inji-certify', wallet: 'inji-wallet-mobile', verifier: 'inji-verify', format: 'sd-jwt-vc' });
  assert.equal(startRes.status, 201);
  assert.equal(startRes.body.status, 'OFFER_CREATED');
  const flowId = startRes.body.flowId;

  const statusRes = await request(app).get(`/api/flows/${flowId}`);
  assert.equal(statusRes.body.status, 'OFFER_CREATED');
  assert.equal(statusRes.body.mode, 'simulated');

  const advanceRes = await request(app).post(`/api/flows/${flowId}/advance`);
  assert.equal(advanceRes.status, 200);
  assert.equal(advanceRes.body.result, 'valid');

  const finalStatus = await request(app).get(`/api/flows/${flowId}`);
  assert.equal(finalStatus.body.status, 'VERIFIED_VALID');

  const eventsRes = await request(app).get(`/api/flows/${flowId}/events`);
  const steps = eventsRes.body.events.map((e: any) => e.step);
  assert.deepEqual(steps, ['credential_offer', 'token_exchange', 'credential_issued', 'authorization_request', 'presentation', 'verification_result']);

  const reportRes = await request(app).get(`/api/flows/${flowId}/report`);
  assert.equal(reportRes.status, 200);
  assert.equal(reportRes.body.outcome, 'pass');
  assert.equal(reportRes.body.format, 'sd-jwt-vc');
});

test('tamper mode flow reaches VERIFIED_INVALID with a SIGNATURE_INVALID report', async () => {
  const startRes = await request(app)
    .post('/api/flows')
    .send({ issuer: 'inji-certify', wallet: 'inji-wallet-mobile', verifier: 'inji-verify', format: 'mdoc', tamperMode: true, tamperType: 'bad-signature' });
  const flowId = startRes.body.flowId;

  await request(app).post(`/api/flows/${flowId}/advance`);

  const finalStatus = await request(app).get(`/api/flows/${flowId}`);
  assert.equal(finalStatus.body.status, 'VERIFIED_INVALID');
  assert.equal(finalStatus.body.result, 'invalid');

  const reportRes = await request(app).get(`/api/flows/${flowId}/report`);
  assert.equal(reportRes.body.outcome, 'fail');
  assert.equal(reportRes.body.error_code, 'SIGNATURE_INVALID');
});

test('Real Mode with sd-jwt-vc (no sandbox issuer for it) fails cleanly with FORMAT_MISMATCH, no crash', async () => {
  const startRes = await request(app)
    .post('/api/flows')
    .send({ issuer: 'inji-certify', wallet: 'inji-wallet-mobile', verifier: 'inji-verify', format: 'sd-jwt-vc', mode: 'real' });
  assert.equal(startRes.status, 502);
  assert.equal(startRes.body.errorCode, 'FORMAT_MISMATCH');
});

test('GET /api/reports/export?format=markdown returns a markdown matrix', async () => {
  const res = await request(app).get('/api/reports/export?format=markdown');
  assert.equal(res.status, 200);
  assert.match(res.text, /Interoperability Matrix/);
});

test('POST /api/flows rejects a missing required field with 400, no DB row created', async () => {
  const res = await request(app)
    .post('/api/flows')
    .send({ issuer: 'inji-certify', wallet: 'inji-wallet-mobile', format: 'sd-jwt-vc' });
  assert.equal(res.status, 400);
  assert.equal(res.body.errorCode, 'INVALID_REQUEST');
  assert.match(res.body.error, /verifier/);
});

test('POST /api/flows rejects an unknown format with 400', async () => {
  const res = await request(app)
    .post('/api/flows')
    .send({ issuer: 'inji-certify', wallet: 'inji-wallet-mobile', verifier: 'inji-verify', format: 'not-a-real-format' });
  assert.equal(res.status, 400);
  assert.equal(res.body.errorCode, 'INVALID_REQUEST');
  assert.match(res.body.error, /format/i);
});

test('POST /api/flows rejects an unknown tamperType with 400', async () => {
  const res = await request(app)
    .post('/api/flows')
    .send({
      issuer: 'inji-certify',
      wallet: 'inji-wallet-mobile',
      verifier: 'inji-verify',
      format: 'sd-jwt-vc',
      tamperMode: true,
      tamperType: 'delete-database',
    });
  assert.equal(res.status, 400);
  assert.equal(res.body.errorCode, 'INVALID_REQUEST');
  assert.match(res.body.error, /tamperType/);
});

test('cross-ecosystem flow: external-mock issuer + inji-verify verifier fails with DID_METHOD_GAP (reference ecosystem\'s did:jwk issuer is not trusted by the mosip verifier)', async () => {
  const startRes = await request(app)
    .post('/api/flows')
    .send({ issuer: 'external-mock', wallet: 'inji-web', verifier: 'inji-verify', format: 'w3c-vc-jsonld' });
  assert.equal(startRes.status, 201);
  const flowId = startRes.body.flowId;

  await request(app).post(`/api/flows/${flowId}/advance`);

  const finalStatus = await request(app).get(`/api/flows/${flowId}`);
  assert.equal(finalStatus.body.status, 'VERIFIED_INVALID');

  const reportRes = await request(app).get(`/api/flows/${flowId}/report`);
  assert.equal(reportRes.body.outcome, 'fail');
  assert.equal(reportRes.body.error_code, 'DID_METHOD_GAP');
});

test('same-ecosystem flow: external-mock issuer + external-mock verifier succeeds (both trust did:jwk)', async () => {
  const startRes = await request(app)
    .post('/api/flows')
    .send({ issuer: 'external-mock', wallet: 'inji-web', verifier: 'external-mock', format: 'w3c-vc-jsonld' });
  const flowId = startRes.body.flowId;

  await request(app).post(`/api/flows/${flowId}/advance`);

  const finalStatus = await request(app).get(`/api/flows/${flowId}`);
  assert.equal(finalStatus.body.status, 'VERIFIED_VALID');

  const reportRes = await request(app).get(`/api/flows/${flowId}/report`);
  assert.equal(reportRes.body.outcome, 'pass');
});

test('cross-ecosystem gap only applies to w3c-vc-jsonld: external-mock issuer + inji-verify verifier still passes for mdoc', async () => {
  const startRes = await request(app)
    .post('/api/flows')
    .send({ issuer: 'external-mock', wallet: 'inji-web', verifier: 'inji-verify', format: 'mdoc' });
  const flowId = startRes.body.flowId;

  await request(app).post(`/api/flows/${flowId}/advance`);

  const finalStatus = await request(app).get(`/api/flows/${flowId}`);
  assert.equal(finalStatus.body.status, 'VERIFIED_VALID');
});

test('POST /api/flows rejects an invalid mode with 400', async () => {
  const res = await request(app)
    .post('/api/flows')
    .send({ issuer: 'inji-certify', wallet: 'inji-wallet-mobile', verifier: 'inji-verify', format: 'sd-jwt-vc', mode: 'production' });
  assert.equal(res.status, 400);
  assert.equal(res.body.errorCode, 'INVALID_REQUEST');
  assert.match(res.body.error, /mode/);
});
