import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
// @ts-ignore - no published types
import * as base58 from 'base58-universal';

const MULTICODEC_ED25519_PUB_PREFIX = Uint8Array.from([0xed, 0x01]);

function multibaseFromRawEd25519(rawPublicKey: Uint8Array): string {
  const prefixed = new Uint8Array(MULTICODEC_ED25519_PUB_PREFIX.length + rawPublicKey.length);
  prefixed.set(MULTICODEC_ED25519_PUB_PREFIX);
  prefixed.set(rawPublicKey, MULTICODEC_ED25519_PUB_PREFIX.length);
  return 'z' + base58.encode(prefixed);
}

function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/** Builds a minimal did:key DID document + verification method, resolved locally (self-certifying, no network). */
export async function resolveDidKey(did: string) {
  const fingerprint = did.replace('did:key:', '').split('#')[0];
  const keyPair = await Ed25519VerificationKey2020.fromFingerprint({ fingerprint });
  return buildDidDocument(did, keyPair);
}

/** Builds a minimal did:jwk DID document + verification method from an embedded EdDSA JWK (self-certifying). */
export async function resolveDidJwk(did: string) {
  const encoded = did.replace('did:jwk:', '').split('#')[0];
  const jwk = JSON.parse(Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  const rawPublicKey = b64urlToBytes(jwk.x);
  const publicKeyMultibase = multibaseFromRawEd25519(rawPublicKey);
  const keyPair = await Ed25519VerificationKey2020.from({
    id: `${did}#0`,
    controller: did,
    publicKeyMultibase,
  });
  return buildDidDocument(did, keyPair);
}

function buildDidDocument(did: string, keyPair: any) {
  const verificationMethod = keyPair.export({ publicKey: true });
  verificationMethod.id = verificationMethod.id || `${did}#${keyPair.fingerprint()}`;
  verificationMethod.controller = did;
  const didDocument = {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
    id: did,
    verificationMethod: [verificationMethod],
    authentication: [verificationMethod.id],
    assertionMethod: [verificationMethod.id],
  };
  return { didDocument, keyPair, verificationMethod };
}

/**
 * Resolves a did:key/did:jwk URL locally for jsigs' documentLoader. Dereferencing the
 * controller (no #fragment) must return the full DID document (assertionMethod list
 * and all), while dereferencing a specific verification method (#fragment) must return
 * just that key - each needs its own @context since it travels standalone through the
 * loader, detached from its parent document.
 */
export async function resolveDidUrl(idOrDid: string) {
  const did = idOrDid.split('#')[0];
  const { didDocument } = did.startsWith('did:jwk:') ? await resolveDidJwk(did) : await resolveDidKey(did);
  if (!idOrDid.includes('#')) return didDocument;
  return { '@context': didDocument['@context'], ...didDocument.verificationMethod[0] };
}
