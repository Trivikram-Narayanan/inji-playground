import { generateKeyPair, exportJWK, SignJWT, importJWK, type JWK } from 'jose';
import crypto from 'crypto';

export type KeyType = 'EdDSA' | 'ES256';

export type HolderKey = {
  did: string;
  keyType: KeyType;
  publicJwk: JWK;
  privateJwk: JWK;
};

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Generates a holder keypair and derives a did:jwk identifier from the public key,
 * per https://github.com/quartzjer/did-jwk — the DID is self-certifying (no registry lookup).
 * EdDSA (Ed25519) is used for the ldp_vc/did:jwk binding path; ES256 (P-256) is used for
 * mdoc's cose_key binding, which the sandbox's MockMdl issuer requires.
 */
export async function generateHolderKey(keyType: KeyType = 'EdDSA'): Promise<HolderKey> {
  const { publicKey, privateKey } =
    keyType === 'EdDSA'
      ? await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true })
      : await generateKeyPair('ES256', { extractable: true });
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);
  publicJwk.alg = keyType;
  privateJwk.alg = keyType;
  const did = `did:jwk:${b64url(JSON.stringify(publicJwk))}`;
  return { did, keyType, publicJwk, privateJwk };
}

/**
 * Builds the OpenID4VCI credential-request proof JWT: a JWT signed by the holder's key,
 * binding the credential to that key (typ: openid4vci-proof+jwt) over the issuer's c_nonce.
 */
export async function buildProofJwt(holderKey: HolderKey, audience: string, nonce: string): Promise<string> {
  const key = await importJWK(holderKey.privateJwk, holderKey.keyType);
  return new SignJWT({ nonce })
    .setProtectedHeader({ alg: holderKey.keyType, typ: 'openid4vci-proof+jwt', jwk: holderKey.publicJwk })
    .setIssuedAt()
    .setAudience(audience)
    .sign(key);
}

export function randomId(bytes = 12): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function pkcePair() {
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}
