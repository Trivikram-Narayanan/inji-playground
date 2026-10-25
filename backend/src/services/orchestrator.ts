import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { runRealIssuance, SandboxError, UnsupportedFormatError, type ProtoEvent } from './realIssuer';
import { verifyCredential, tamperCredential } from './realVerifier';
import { issueByFormat } from '../formats';
import { getFormat, type FormatId } from '../formats/registry';
import { publish } from './eventBus';
import { withTimeout, StepTimeoutError } from './timeout';
import { triageFailure } from './failureTriage';
import { sandboxConfig } from '../config';
import { getEcosystem, checkDidMethodTrust } from '../ecosystems/registry';

export type FlowConfig = {
  issuer: string;
  wallet: string;
  verifier: string;
  format: string;
  tamperMode?: boolean;
  tamperType?: string;
  mode?: 'real' | 'simulated';
};

const QR_MAX_BYTES = 2953; // rough alphanumeric-QR capacity ceiling at low error correction

const STEP_DELAY_MS = 450; // Simulated Mode: small pacing so the live SSE stream is visibly "live"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function setStatus(db: any, flowId: string, status: string) {
  await db.run(`UPDATE test_runs SET status = ? WHERE id = ?`, [status, flowId]);
  publish(flowId, { type: 'status', flowId, data: { status } });
}

async function insertEvent(db: any, flowId: string, e: ProtoEvent) {
  const id = uuidv4();
  await db.run(
    `INSERT INTO protocol_events (id, flow_id, step, actor, payload, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, flowId, e.step, e.actor, JSON.stringify(e.payload), e.status]
  );
  const row = await db.get(`SELECT * FROM protocol_events WHERE id = ?`, [id]);
  publish(flowId, { type: 'event', flowId, data: row });
  return row;
}

async function writeReport(db: any, flow: any, outcome: 'pass' | 'fail', errorCode: string | null, errorDetail: string | null, proofType: string) {
  const firstEvent = await db.get(`SELECT timestamp FROM protocol_events WHERE flow_id = ? ORDER BY timestamp ASC LIMIT 1`, [flow.id]);
  const durationMs = firstEvent ? Math.max(1000, new Date().getTime() - new Date(`${firstEvent.timestamp.replace(' ', 'T')}Z`).getTime()) : 2400; // SQLite CURRENT_TIMESTAMP is UTC
  await db.run(
    `INSERT INTO reports (flow_id, issuer, wallet, verifier, format, proof_type, outcome, duration_ms, error_code, error_detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [flow.id, flow.issuer, flow.wallet, flow.verifier, flow.format, proofType, outcome, durationMs, errorCode, errorDetail]
  );
}

async function failFlow(db: any, flow: any, errorCode: string, errorDetail: string, proofType = 'n/a') {
  await db.run(`UPDATE test_runs SET status = 'FAILED', result = 'error', completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [flow.id]);
  publish(flow.id, { type: 'status', flowId: flow.id, data: { status: 'FAILED', errorCode, errorDetail } });
  await writeReport(db, flow, 'fail', errorCode, errorDetail, proofType);
}

export class Orchestrator {
  static async startFlow(config: FlowConfig) {
    const db = await getDb();
    const flowId = uuidv4();
    const mode = config.mode === 'real' ? 'real' : 'simulated';

    await db.run(
      `INSERT INTO test_runs (id, issuer, wallet, verifier, format, tamper_mode, tamper_type, status, mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [flowId, config.issuer, config.wallet, config.verifier, config.format, config.tamperMode ? 1 : 0, config.tamperType || null, 'CREATED', mode]
    );
    publish(flowId, { type: 'status', flowId, data: { status: 'CREATED' } });

    if (mode === 'real') {
      return Orchestrator.startRealFlow(flowId, db, config.format as FormatId);
    }
    return Orchestrator.startSimulatedFlow(flowId, db, config);
  }

  private static async startSimulatedFlow(flowId: string, db: any, config: FlowConfig) {
    const format = getFormat(config.format);
    const mockOfferPayload = {
      credential_issuer: `https://${config.issuer}.example.com`,
      credential_configuration_ids: [format.vcFormat],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': 'mock_code_' + uuidv4(),
          tx_code: { length: 4, input_mode: 'numeric' },
        },
      },
    };

    const offerBytes = Buffer.byteLength(JSON.stringify(mockOfferPayload), 'utf8');
    if (offerBytes > QR_MAX_BYTES) {
      const flow = await db.get(`SELECT * FROM test_runs WHERE id = ?`, [flowId]);
      await insertEvent(db, flowId, { step: 'credential_offer', actor: 'issuer', payload: { offer: mockOfferPayload, qrSizeBytes: offerBytes }, status: 'error' });
      await failFlow(db, flow, 'QR_SIZE_EXCEEDED', `Credential offer QR payload is ${offerBytes} bytes, exceeding the ${QR_MAX_BYTES}-byte alphanumeric QR ceiling`);
      const error: any = new Error('QR_SIZE_EXCEEDED');
      error.flowId = flowId;
      throw error;
    }

    await insertEvent(db, flowId, { step: 'credential_offer', actor: 'issuer', payload: mockOfferPayload, status: 'success' });
    await setStatus(db, flowId, 'OFFER_CREATED');

    return { flowId, status: 'OFFER_CREATED', offer: mockOfferPayload, mode: 'simulated' };
  }

  private static async startRealFlow(flowId: string, db: any, formatId: FormatId) {
    const flow = await db.get(`SELECT * FROM test_runs WHERE id = ?`, [flowId]);
    try {
      const { holderKey, rawCredential } = await withTimeout(
        runRealIssuance(formatId, async (e) => {
          await insertEvent(db, flowId, e);
          if (e.status !== 'success') return;
          if (e.step === 'credential_offer') await setStatus(db, flowId, 'OFFER_CREATED');
          if (e.step === 'token_exchange') await setStatus(db, flowId, 'TOKEN_EXCHANGED');
          if (e.step === 'credential_issued') await setStatus(db, flowId, 'CREDENTIAL_ISSUED');
        }),
        sandboxConfig.stepTimeoutMs,
        'issuance',
      );
      await db.run(`UPDATE test_runs SET holder_did = ?, holder_jwk = ?, raw_credential = ? WHERE id = ?`, [
        holderKey.did,
        JSON.stringify(holderKey.privateJwk),
        JSON.stringify(rawCredential),
        flowId,
      ]);
      return { flowId, status: 'CREDENTIAL_ISSUED', mode: 'real' };
    } catch (err: any) {
      let errorCode = 'UNKNOWN_ERROR';
      let errorDetail = err.message;
      if (err instanceof UnsupportedFormatError) {
        errorCode = err.code;
      } else if (err instanceof StepTimeoutError) {
        errorCode = 'TIMEOUT';
      } else if (err instanceof SandboxError) {
        // LLM triage (when ANTHROPIC_API_KEY is set) turns the raw captured payloads into
        // a specific, actionable explanation instead of a bare error string; it always
        // degrades to the same heuristic classifier used elsewhere when no key is set or
        // the call fails, so this can never be the reason a result comes back wrong.
        const triage = await triageFailure({ errorMessage: err.message, context: { format: formatId, partialEvents: err.partialEvents } });
        errorCode = triage.errorCode;
        errorDetail = triage.explanation;
      }
      await failFlow(db, flow, errorCode, errorDetail);
      const error: any = new Error(`Real sandbox issuance failed: ${errorDetail}. ${errorCode === 'FORMAT_MISMATCH' ? '' : 'The MOSIP Collab sandbox may be temporarily unavailable - try Simulated Mode instead.'}`);
      error.flowId = flowId;
      error.errorCode = errorCode;
      throw error;
    }
  }

  static async getFlowStatus(flowId: string) {
    const db = await getDb();
    return db.get(`SELECT * FROM test_runs WHERE id = ?`, [flowId]);
  }

  static async getFlowEvents(flowId: string) {
    const db = await getDb();
    return db.all(`SELECT * FROM protocol_events WHERE flow_id = ? ORDER BY timestamp ASC`, [flowId]);
  }

  static async advanceFlow(flowId: string) {
    const db = await getDb();
    const flow = await db.get(`SELECT * FROM test_runs WHERE id = ?`, [flowId]);
    if (!flow || !['OFFER_CREATED', 'CREDENTIAL_ISSUED'].includes(flow.status)) {
      throw new Error('Flow not in a state to be advanced');
    }

    if (flow.mode === 'real') {
      return Orchestrator.advanceRealFlow(flow, db);
    }
    return Orchestrator.advanceSimulatedFlow(flow, db);
  }

  private static async advanceSimulatedFlow(flow: any, db: any) {
    const flowId = flow.id;
    const formatId = flow.format as FormatId;
    // Only the w3c-vc-jsonld path issues with an ecosystem-specific DID method (see
    // formats/ldpVc.ts); sd-jwt-vc/mdoc use a format-native key mechanism the trust
    // matrix doesn't model, so the DID-method trust gate is scoped to that format.
    const didTrust = formatId === 'w3c-vc-jsonld' ? checkDidMethodTrust(flow.issuer, flow.verifier) : null;

    await wait(STEP_DELAY_MS);
    await insertEvent(db, flowId, { step: 'token_exchange', actor: 'wallet', payload: { grant_type: 'pre-authorized_code', pre_authorized_code: 'mock_code' }, status: 'success' });
    await setStatus(db, flowId, 'TOKEN_EXCHANGED');

    await wait(STEP_DELAY_MS);
    let rawCredential: any;
    try {
      const didMethod = formatId === 'w3c-vc-jsonld' ? getEcosystem(flow.issuer).issuerDidMethod : undefined;
      rawCredential = await withTimeout(issueByFormat(formatId, undefined, didMethod), sandboxConfig.stepTimeoutMs, 'CREDENTIAL_ISSUED');
    } catch (err: any) {
      const errorCode = err instanceof StepTimeoutError ? 'TIMEOUT' : 'UNKNOWN_ERROR';
      await insertEvent(db, flowId, { step: 'credential_issued', actor: 'issuer', payload: { error: err.message }, status: 'error' });
      await failFlow(db, flow, errorCode, err.message);
      return { status: 'FAILED', result: 'error' };
    }
    await db.run(`UPDATE test_runs SET raw_credential = ? WHERE id = ?`, [JSON.stringify(rawCredential), flowId]);
    await insertEvent(db, flowId, { step: 'credential_issued', actor: 'issuer', payload: { credential: rawCredential }, status: 'success' });
    await setStatus(db, flowId, 'CREDENTIAL_ISSUED');

    await wait(STEP_DELAY_MS);
    await insertEvent(db, flowId, {
      step: 'authorization_request',
      actor: 'verifier',
      payload: { client_id: 'inji_verify', response_type: 'vp_token', presentation_definition: { id: 'mock_pd', format: getFormat(formatId).vcFormat } },
      status: 'success',
    });
    await setStatus(db, flowId, 'AUTH_REQUESTED');

    let credentialForPresentation = rawCredential;
    let tamperNote: string | null = null;
    if (flow.tamper_mode) {
      credentialForPresentation = await tamperCredential(formatId, rawCredential, flow.tamper_type);
      tamperNote = `Tamper type '${flow.tamper_type}' applied to the real signed/encoded credential before presentation.`;
    }

    await wait(STEP_DELAY_MS);
    await insertEvent(db, flowId, {
      step: 'presentation',
      actor: 'wallet',
      payload: { note: tamperNote, vp_token: { verifiableCredential: [credentialForPresentation] } },
      status: 'success',
    });
    await setStatus(db, flowId, 'PRESENTED');

    const crossEcosystemOverride = didTrust && !didTrust.trusted
      ? {
          valid: false,
          errorCode: 'DID_METHOD_GAP',
          errorDetail: `${didTrust.issuerEcosystem.label} issues with ${didTrust.issuerEcosystem.issuerDidMethod}, which ${didTrust.verifierEcosystem.label}'s verifier does not trust (accepts: ${didTrust.verifierEcosystem.trustedIssuerDidMethods.join(', ')})`,
          checks: { did_method_trusted: false },
        }
      : null;
    const outcome = crossEcosystemOverride || (await verifyCredential(formatId, credentialForPresentation));

    return Orchestrator.finishVerification(db, flow, outcome, 'success');
  }

  private static async advanceRealFlow(flow: any, db: any) {
    const flowId = flow.id;
    const formatId = flow.format as FormatId;
    const holderCredential = JSON.parse(flow.raw_credential);

    await insertEvent(db, flowId, {
      step: 'authorization_request',
      actor: 'verifier',
      payload: {
        note: 'Self-hosted OpenID4VP relying party (this BFF acting as verifier, since we have no registered eSignet wallet client to bounce a real third-party wallet through)',
        presentation_definition: { id: 'interop-playground-pd', format: getFormat(formatId).vcFormat, input_descriptors: [{ id: 'mosip-vc', constraints: { fields: [{ path: ['$.type'] }] } }] },
      },
      status: 'success',
    });
    await setStatus(db, flowId, 'AUTH_REQUESTED');

    let credentialForPresentation = holderCredential;
    let tamperNote: string | null = null;
    if (flow.tamper_mode) {
      credentialForPresentation = await tamperCredential(formatId, holderCredential, flow.tamper_type);
      tamperNote = `Tamper type '${flow.tamper_type}' applied to the real signed credential before presentation.`;
    }

    await insertEvent(db, flowId, { step: 'presentation', actor: 'wallet', payload: { note: tamperNote, vp_token: { verifiableCredential: [credentialForPresentation] } }, status: 'success' });
    await setStatus(db, flowId, 'PRESENTED');

    const outcome = await verifyCredential(formatId, credentialForPresentation);
    return Orchestrator.finishVerification(db, flow, outcome, 'EdDSA/ES256');
  }

  private static async finishVerification(db: any, flow: any, outcome: { valid: boolean; errorCode: string | null; errorDetail: string | null; checks: Record<string, boolean> }, proofType: string) {
    const flowId = flow.id;
    let resultStatus: string;
    let terminalState: string;
    if (!outcome.valid && outcome.errorCode === 'CREDENTIAL_EXPIRED') {
      resultStatus = 'valid-but-expired';
      terminalState = 'VERIFIED_EXPIRED';
    } else if (outcome.valid) {
      resultStatus = 'valid';
      terminalState = 'VERIFIED_VALID';
    } else {
      resultStatus = 'invalid';
      terminalState = 'VERIFIED_INVALID';
    }

    await insertEvent(db, flowId, {
      step: 'verification_result',
      actor: 'verifier',
      payload: { verification_result: resultStatus, checks: outcome.checks, errorCode: outcome.errorCode, errorDetail: outcome.errorDetail },
      status: outcome.valid ? 'success' : 'error',
    });

    await db.run(`UPDATE test_runs SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [terminalState, resultStatus, flowId]);
    publish(flowId, { type: 'status', flowId, data: { status: terminalState, result: resultStatus } });

    await writeReport(db, flow, resultStatus === 'valid' ? 'pass' : 'fail', outcome.errorCode, outcome.errorDetail, proofType);

    return { status: 'COMPLETED', result: resultStatus };
  }

  static async getFlowReport(flowId: string) {
    const db = await getDb();
    return db.get(`SELECT * FROM reports WHERE flow_id = ?`, [flowId]);
  }

  static async getAllReports(filters?: { format?: string; outcome?: string; issuer?: string }) {
    const db = await getDb();
    const clauses: string[] = [];
    const params: any[] = [];
    if (filters?.format) { clauses.push('format = ?'); params.push(filters.format); }
    if (filters?.outcome) { clauses.push('outcome = ?'); params.push(filters.outcome); }
    if (filters?.issuer) { clauses.push('issuer = ?'); params.push(filters.issuer); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return db.all(`SELECT * FROM reports ${where} ORDER BY created_at DESC`, params);
  }

  static async getReportStats() {
    const db = await getDb();
    const total = await db.get(`SELECT COUNT(*) as count FROM reports`);
    const passed = await db.get(`SELECT COUNT(*) as count FROM reports WHERE outcome = 'pass'`);
    const failed = await db.get(`SELECT COUNT(*) as count FROM reports WHERE outcome = 'fail'`);
    const commonError = await db.get(`
      SELECT error_code, COUNT(error_code) as count
      FROM reports
      WHERE error_code IS NOT NULL
      GROUP BY error_code
      ORDER BY count DESC
      LIMIT 1
    `);

    return {
      totalTests: total.count,
      passed: passed.count,
      failed: failed.count,
      passRate: total.count > 0 ? Math.round((passed.count / total.count) * 100) : 0,
      mostCommonError: commonError ? commonError.error_code : 'None',
    };
  }
}
