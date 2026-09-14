import * as vc from '@digitalbazaar/vc';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
// @ts-ignore - no published types
import jsonld from 'jsonld';
import { resolveDidUrl, didJwkFromEd25519KeyPair } from '../services/didKey';
import type { DidMethod } from '../ecosystems/registry';

const nodeLoader = jsonld.documentLoaders.node();

async function documentLoader(url: string) {
  if (url.startsWith('did:key:') || url.startsWith('did:jwk:')) {
    const document = await resolveDidUrl(url);
    return { contextUrl: null, documentUrl: url, document };
  }
  return nodeLoader(url);
}

export type LdpVcIssueResult = { credential: any };

/**
 * Issues a real, signed W3C Verifiable Credential (Ed25519Signature2020, self-certifying
 * DID - no CA/registry needed) - used by Simulated Mode to "play issuer" with a real
 * signature instead of a fabricated string, verifiable by the same code path Real Mode uses.
 *
 * `didMethod` lets a caller issue as a specific ecosystem (see `ecosystems/registry.ts`):
 * MOSIP/Inji issuers use did:key here, while the generic/non-MOSIP reference ecosystem uses
 * did:jwk, so two ecosystems produce genuinely different issuer identities rather than both
 * running through the same code path under different labels.
 */
export async function issue(claims: Record<string, unknown>, expirationDate?: string, didMethod: DidMethod = 'did:key'): Promise<LdpVcIssueResult> {
  const keyPair = await Ed25519VerificationKey2020.generate({});
  const did = didMethod === 'did:jwk' ? didJwkFromEd25519KeyPair(keyPair) : `did:key:${keyPair.fingerprint()}`;
  keyPair.controller = did;
  // Must match the verification-method id `resolveDidJwk`/`resolveDidKey` (services/didKey.ts)
  // construct when resolving this DID back during verification, or the proof's
  // verificationMethod reference won't line up with the resolved key document.
  keyPair.id = didMethod === 'did:jwk' ? `${did}#0` : `${did}#${keyPair.fingerprint()}`;

  const unsigned = {
    '@context': ['https://www.w3.org/ns/credentials/v2', { '@vocab': 'https://playground.example/vocab#' }],
    type: ['VerifiableCredential', 'InteropPlaygroundCredential'],
    issuer: did,
    validFrom: new Date().toISOString(),
    ...(expirationDate ? { validUntil: expirationDate, expirationDate } : {}),
    credentialSubject: claims,
  };

  const credential = await vc.issue({ credential: unsigned, suite: new Ed25519Signature2020({ key: keyPair }), documentLoader });
  return { credential };
}

export type VerificationOutcome = {
  valid: boolean;
  errorCode: string | null;
  errorDetail: string | null;
  checks: Record<string, boolean>;
};

export async function verify(credential: any): Promise<VerificationOutcome> {
  const checks: Record<string, boolean> = { signature: false, not_expired: false, claims_present: false };

  checks.not_expired = !credential.expirationDate || new Date(credential.expirationDate).getTime() > Date.now();
  checks.claims_present = !!credential.credentialSubject && Object.keys(credential.credentialSubject).length > 0;

  // Expiry is checked as a cheap pre-check before the more expensive signature
  // verification - this also means an expired credential reports as expired even
  // if forcing the expiry (Tamper Mode) has, correctly, also broken its signature.
  if (!checks.not_expired) {
    return { valid: false, errorCode: 'CREDENTIAL_EXPIRED', errorDetail: `Credential expired at ${credential.expirationDate}`, checks };
  }

  let signatureResult: any;
  try {
    signatureResult = await vc.verifyCredential({ credential, suite: new Ed25519Signature2020(), documentLoader });
    checks.signature = !!signatureResult.verified;
  } catch (err: any) {
    checks.signature = false;
    signatureResult = { error: err.message };
  }

  if (!checks.signature) {
    return { valid: false, errorCode: 'SIGNATURE_INVALID', errorDetail: `Signature verification failed: ${JSON.stringify(signatureResult?.error || signatureResult?.results)}`, checks };
  }
  if (!checks.claims_present) {
    return { valid: false, errorCode: 'CLAIM_MISMATCH', errorDetail: 'Expected claims missing from credentialSubject', checks };
  }
  return { valid: true, errorCode: null, errorDetail: null, checks };
}

/** Genuinely mutates a real signed credential so verification fails for a concrete reason. */
export function tamper(credential: any, tamperType: string): any {
  const tampered = JSON.parse(JSON.stringify(credential));
  if (tamperType === 'bad-signature' && tampered.proof) {
    const key = tampered.proof.proofValue ? 'proofValue' : tampered.proof.jws ? 'jws' : null;
    if (key) {
      const val: string = tampered.proof[key];
      const mid = Math.floor(val.length / 2);
      const flippedChar = val[mid] === 'a' ? 'b' : 'a';
      tampered.proof[key] = val.slice(0, mid) + flippedChar + val.slice(mid + 1);
    }
  } else if (tamperType === 'claim-corruption' && tampered.credentialSubject) {
    const keys = Object.keys(tampered.credentialSubject).filter((k) => k !== 'id');
    if (keys.length > 0) {
      tampered.credentialSubject[keys[0]] = `TAMPERED_${tampered.credentialSubject[keys[0]]}`;
    }
  } else if (tamperType === 'expired') {
    tampered.expirationDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }
  return tampered;
}
