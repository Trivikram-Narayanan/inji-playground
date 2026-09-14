import axios from 'axios';
import { sandboxConfig as cfg } from '../config';
import { generateHolderKey, buildProofJwt, randomId, pkcePair, type HolderKey } from './crypto';
import { getFormat, type FormatId } from '../formats/registry';

export type ProtoEvent = { step: string; actor: string; payload: any; status: 'success' | 'error' };
export type OnEvent = (event: ProtoEvent) => void | Promise<void>;

export class SandboxError extends Error {
  constructor(message: string, public partialEvents: ProtoEvent[] = []) {
    super(message);
  }
}

export class UnsupportedFormatError extends Error {
  code = 'FORMAT_MISMATCH';
}

const http = axios.create({
  timeout: cfg.httpTimeoutMs,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'application/json',
  },
  validateStatus: () => true,
});

const wrap = (request: any) => ({ requestTime: new Date().toISOString(), request });

async function esignetPost(base: string, path: string, body: any, xsrf: { token: string | null }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (xsrf.token) {
    headers['Cookie'] = `XSRF-TOKEN=${xsrf.token}`;
    headers['X-XSRF-TOKEN'] = xsrf.token;
  }
  const res = await http.post(`${base}${path}`, body, { headers });
  const setCookie = res.headers['set-cookie']?.[0];
  const m = setCookie?.match(/XSRF-TOKEN=([^;]+)/);
  if (m) xsrf.token = m[1];
  return res;
}

async function withRetries<T>(fn: () => Promise<T>, isOk: (r: T) => boolean, attempts: number): Promise<T> {
  let last: T | undefined;
  for (let i = 0; i < attempts; i++) {
    last = await fn();
    if (isOk(last)) return last;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400));
  }
  return last as T;
}

/**
 * Runs the real OpenID4VCI issuance flow against the MOSIP Collab sandbox for the given
 * format: headless OIDC login (oauth-details -> send-otp -> authenticate -> auth-code)
 * against the format's eSignet host, token exchange via Mimoto (which holds the
 * registered private_key_jwt client we don't have), then credential request+download
 * directly against the format's Certify host. Each completed step is reported through
 * `onEvent` as it happens (not batched) so callers can stream it live.
 *
 * The sandbox's pre-auth transaction cache has been observed to drop transactions
 * between calls (a known infra flakiness, not a request-shape issue) - send-otp/authenticate
 * are retried a few times before giving up.
 */
export async function runRealIssuance(formatId: FormatId, onEvent: OnEvent): Promise<{ holderKey: HolderKey; rawCredential: any }> {
  const format = getFormat(formatId);
  if (!format.real) {
    throw new UnsupportedFormatError(`No MOSIP Collab sandbox issuer offers ${format.label} - Real Mode only supports formats with a real sandbox issuer. Use Simulated Mode for this format.`);
  }
  const real = format.real;
  const xsrf = { token: null as string | null };

  await esignetPost(real.esignetHost, '/authorization/v3/oauth-details', {}, xsrf); // warm up XSRF cookie

  const state = randomId();
  const nonce = randomId();
  const { verifier, challenge } = pkcePair();

  const oauthDetailsReq = wrap({
    clientId: real.clientId,
    scope: real.scope,
    responseType: 'code',
    redirectUri: cfg.redirectUri,
    state,
    nonce,
    acrValues: cfg.acrValues,
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
  });
  const oauthDetailsRes = await esignetPost(real.esignetHost, '/authorization/v3/oauth-details', oauthDetailsReq, xsrf);
  const oauthDetailsBody = oauthDetailsRes.data;
  if (oauthDetailsRes.status !== 200 || !oauthDetailsBody?.response) {
    const event: ProtoEvent = { step: 'credential_offer', actor: 'issuer', payload: { oauthDetails: { request: oauthDetailsReq, response: oauthDetailsBody } }, status: 'error' };
    await onEvent(event);
    throw new SandboxError('eSignet oauth-details failed', [event]);
  }
  const transactionId = oauthDetailsBody.response.transactionId;
  const credentialScopes = oauthDetailsBody.response.credentialScopes || [];

  const sendOtp = await withRetries(
    () => esignetPost(real.esignetHost, '/authorization/send-otp', wrap({ transactionId, individualId: cfg.mockUin, otpChannels: ['email', 'phone'] }), xsrf),
    (r) => r.status === 200 && !!r.data?.response,
    cfg.transactionRetries,
  );
  if (!sendOtp.data?.response) {
    const event: ProtoEvent = {
      step: 'credential_offer',
      actor: 'issuer',
      payload: { oauthDetails: { request: oauthDetailsReq, response: oauthDetailsBody }, sendOtp: sendOtp.data },
      status: 'error',
    };
    await onEvent(event);
    throw new SandboxError(`eSignet send-otp failed: ${sendOtp.data?.errors?.[0]?.errorMessage || 'unknown'}`, [event]);
  }

  const authenticate = await withRetries(
    () =>
      esignetPost(
        real.esignetHost,
        '/authorization/v2/authenticate',
        wrap({ transactionId, individualId: cfg.mockUin, challengeList: [{ authFactorType: 'OTP', challenge: cfg.mockOtp, format: 'alpha-numeric' }] }),
        xsrf,
      ),
    (r) => r.status === 200 && !!r.data?.response,
    cfg.transactionRetries,
  );
  if (!authenticate.data?.response) {
    const event: ProtoEvent = {
      step: 'credential_offer',
      actor: 'issuer',
      payload: { oauthDetails: { request: oauthDetailsReq, response: oauthDetailsBody }, sendOtp: sendOtp.data, authenticate: authenticate.data },
      status: 'error',
    };
    await onEvent(event);
    throw new SandboxError(`eSignet authenticate failed: ${authenticate.data?.errors?.[0]?.errorMessage || 'unknown'}`, [event]);
  }

  const essential = oauthDetailsBody.response.essentialClaims || [];
  const voluntary = oauthDetailsBody.response.voluntaryClaims || [];
  const authCode = await esignetPost(
    real.esignetHost,
    '/authorization/auth-code',
    wrap({ transactionId, acceptedClaims: [...essential, ...voluntary], permittedAuthorizeScopes: credentialScopes }),
    xsrf,
  );
  if (!authCode.data?.response) {
    const event: ProtoEvent = {
      step: 'credential_offer',
      actor: 'issuer',
      payload: { oauthDetails: { request: oauthDetailsReq, response: oauthDetailsBody }, sendOtp: sendOtp.data, authenticate: authenticate.data, authCode: authCode.data },
      status: 'error',
    };
    await onEvent(event);
    throw new SandboxError(`eSignet auth-code failed: ${authCode.data?.errors?.[0]?.errorMessage || 'unknown'}`, [event]);
  }

  await onEvent({
    step: 'credential_offer',
    actor: 'issuer',
    payload: {
      note: `Real headless OIDC login against ${real.esignetHost} (mock UIN + mock OTP)`,
      oauthDetails: { request: oauthDetailsReq, response: oauthDetailsBody },
      sendOtp: sendOtp.data,
      authenticate: authenticate.data,
      authCode: authCode.data,
    },
    status: 'success',
  });

  const { code, state: retState } = authCode.data.response;

  // Token exchange proxied through Mimoto, which holds the registered private_key_jwt client.
  const tokenQs = new URLSearchParams({ code, state: retState, grant_type: 'authorization_code', redirect_uri: cfg.redirectUri, code_verifier: verifier });
  const tokenRes = await http.post(`${cfg.mimotoBase}/get-token/${real.issuerId}?${tokenQs}`);
  if (tokenRes.status !== 200 || !tokenRes.data?.access_token) {
    const event: ProtoEvent = { step: 'token_exchange', actor: 'wallet', payload: { request: { qs: Object.fromEntries(tokenQs) }, response: tokenRes.data }, status: 'error' };
    await onEvent(event);
    throw new SandboxError('Mimoto token exchange failed', [event]);
  }
  await onEvent({ step: 'token_exchange', actor: 'wallet', payload: { request: { qs: Object.fromEntries(tokenQs) }, response: tokenRes.data }, status: 'success' });

  const accessToken = tokenRes.data.access_token;
  const cNonce = tokenRes.data.c_nonce;

  // Holder key + proof-of-possession, then the real Certify credential endpoint.
  const holderKey = await generateHolderKey(real.keyType);
  const nonceRes = await http.post(`${real.issuerHost}/v1/certify/nonce`, {});
  const nonce2 = nonceRes.data?.response?.c_nonce || cNonce;
  const proofJwt = await buildProofJwt(holderKey, real.issuerHost, nonce2);

  const credentialReq = {
    credential_configuration_id: real.credentialConfigurationId,
    proof: { proof_type: 'jwt', jwt: proofJwt },
  };
  const credentialRes = await http.post(`${real.issuerHost}/v1/certify/issuance/credential`, credentialReq, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  if (credentialRes.status !== 200 || !credentialRes.data?.credential) {
    const event: ProtoEvent = { step: 'credential_issued', actor: 'issuer', payload: { request: credentialReq, response: credentialRes.data }, status: 'error' };
    await onEvent(event);
    throw new SandboxError('Certify credential issuance failed', [event]);
  }
  await onEvent({ step: 'credential_issued', actor: 'issuer', payload: { request: credentialReq, response: credentialRes.data }, status: 'success' });

  return { holderKey, rawCredential: credentialRes.data.credential };
}
