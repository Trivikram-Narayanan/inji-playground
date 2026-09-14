import { SignJWT, importJWK, jwtVerify, type JWK } from 'jose';
import crypto from 'crypto';
import { generateHolderKey, type HolderKey } from '../services/crypto';

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlJson = (obj: any) => b64url(JSON.stringify(obj));
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

export type SdJwtIssueResult = { sdJwt: string; issuerKey: HolderKey };

/**
 * Issues a real IETF SD-JWT VC (draft-ietf-oauth-sd-jwt-vc): an EdDSA-signed JWT carrying
 * `_sd` digests of each disclosed claim, followed by the base64url disclosures themselves,
 * `~`-joined. The issuer's public key travels in the JWT header (`jwk`) so verification is
 * self-contained, consistent with the did:jwk approach used for the ldp_vc format.
 */
export async function issue(claims: Record<string, unknown>, expirationDate?: string): Promise<SdJwtIssueResult> {
  const issuerKey = await generateHolderKey('EdDSA');
  const key = await importJWK(issuerKey.privateJwk, 'EdDSA');

  const disclosures: string[] = [];
  const digests: string[] = [];
  for (const [claimName, claimValue] of Object.entries(claims)) {
    const salt = b64url(crypto.randomBytes(16));
    const disclosure = b64urlJson([salt, claimName, claimValue]);
    disclosures.push(disclosure);
    digests.push(b64url(crypto.createHash('sha256').update(disclosure).digest()));
  }

  const jwt = await new SignJWT({
    vct: 'InteropPlaygroundCredential',
    iss: issuerKey.did,
    _sd: digests,
    _sd_alg: 'sha-256',
    ...(expirationDate ? { exp: Math.floor(new Date(expirationDate).getTime() / 1000) } : {}),
  })
    .setProtectedHeader({ alg: 'EdDSA', typ: 'dc+sd-jwt', jwk: issuerKey.publicJwk })
    .setIssuedAt()
    .sign(key);

  return { sdJwt: `${jwt}~${disclosures.join('~')}~`, issuerKey };
}

export type VerificationOutcome = {
  valid: boolean;
  errorCode: string | null;
  errorDetail: string | null;
  checks: Record<string, boolean>;
};

export async function verify(sdJwt: string): Promise<VerificationOutcome> {
  const checks: Record<string, boolean> = { signature: false, not_expired: false, disclosures_match: false };
  const [jwt, ...rest] = sdJwt.split('~');
  const disclosures = rest.filter(Boolean);

  const [headerB64, payloadB64] = jwt.split('.');
  let header: any, payload: any;
  try {
    header = JSON.parse(fromB64url(headerB64));
    payload = JSON.parse(fromB64url(payloadB64));
  } catch {
    return { valid: false, errorCode: 'UNKNOWN_ERROR', errorDetail: 'Malformed SD-JWT (could not parse header/payload)', checks };
  }

  // Expiry is checked before signature - a cheap, non-cryptographic pre-check (same
  // ordering used by the ldp_vc/mdoc verifiers), so a forced-past exp still reports
  // CREDENTIAL_EXPIRED even though mutating it has, correctly, also broken the signature.
  checks.not_expired = !payload.exp || payload.exp * 1000 > Date.now();
  if (!checks.not_expired) {
    return { valid: false, errorCode: 'CREDENTIAL_EXPIRED', errorDetail: `SD-JWT expired at ${new Date(payload.exp * 1000).toISOString()}`, checks };
  }

  try {
    const issuerPublicKey = await importJWK(header.jwk as JWK, 'EdDSA');
    await jwtVerify(jwt, issuerPublicKey);
    checks.signature = true;
  } catch (err: any) {
    return { valid: false, errorCode: 'SIGNATURE_INVALID', errorDetail: `SD-JWT signature verification failed: ${err.message}`, checks };
  }

  const sdDigests: string[] = payload._sd || [];
  const disclosedDigests = disclosures.map((d) => b64url(crypto.createHash('sha256').update(d).digest()));
  checks.disclosures_match = disclosedDigests.every((d) => sdDigests.includes(d)) && disclosures.length > 0;
  if (!checks.disclosures_match) {
    return { valid: false, errorCode: 'CLAIM_MISMATCH', errorDetail: 'One or more disclosures do not match the JWT\'s _sd digests', checks };
  }

  return { valid: true, errorCode: null, errorDetail: null, checks };
}

/** Genuinely mutates a real SD-JWT so verification fails for a concrete, honest reason. */
export function tamper(sdJwt: string, tamperType: string): string {
  const parts = sdJwt.split('~');
  const jwt = parts[0];

  if (tamperType === 'bad-signature') {
    const [h, p, sig] = jwt.split('.');
    const mid = Math.floor(sig.length / 2);
    const flipped = sig[mid] === 'a' ? 'b' : 'a';
    parts[0] = `${h}.${p}.${sig.slice(0, mid)}${flipped}${sig.slice(mid + 1)}`;
  } else if (tamperType === 'claim-corruption' && parts.length > 1) {
    try {
      const decoded = JSON.parse(fromB64url(parts[1]));
      decoded[2] = `TAMPERED_${decoded[2]}`;
      parts[1] = b64urlJson(decoded);
    } catch {
      /* leave as-is if unparseable */
    }
  } else if (tamperType === 'expired') {
    const [h, p] = jwt.split('.');
    try {
      const payload = JSON.parse(fromB64url(p));
      payload.exp = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      parts[0] = `${h}.${b64urlJson(payload)}.${jwt.split('.')[2]}`;
    } catch {
      /* leave as-is */
    }
  }
  return parts.join('~');
}
