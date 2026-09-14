import cbor from 'cbor';
import crypto from 'crypto';

const DOC_TYPE = 'org.iso.18013.5.1.mDL';
const NAMESPACE = 'org.iso.18013.5.1';
const COSE_ALG_ES256 = -7;
// Private-use COSE header label for the embedded issuer public key (JWK JSON, utf8 bstr).
// Real ISO 18013-5 mdocs carry an IACA-chained X.509 cert (x5chain) here instead; skipping
// the PKI/CA trust chain and delivering a self-certifying key is the same documented
// simplification already used for did:jwk/did:key verification elsewhere in this app.
const HEADER_LABEL_ISSUER_JWK = -65537;

/** Promise-wrapped CBOR encode - the package's synchronous `encode`/`encodeOne` helpers
 * truncate output in the installed version; the stream Encoder is the reliable path. */
function cborEncode(value: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const enc = new cbor.Encoder();
    const chunks: Buffer[] = [];
    enc.on('data', (c: Buffer) => chunks.push(c));
    enc.on('end', () => resolve(Buffer.concat(chunks)));
    enc.on('error', reject);
    enc.end(value);
  });
}

function cborDecode(buf: Buffer): any {
  return cbor.decodeFirstSync(buf);
}

function sigStructure(protectedBytes: Buffer, payloadBytes: Buffer): Promise<Buffer> {
  return cborEncode(['Signature1', protectedBytes, Buffer.alloc(0), payloadBytes]);
}

export type MdocIssueResult = { mdocBase64: string; publicJwk: any };

/**
 * Issues a real CBOR-encoded, COSE_Sign1-signed (ES256) mdoc-shaped credential:
 * an IssuerSigned structure whose issuerAuth signs a real MobileSecurityObject
 * (docType, validity, and SHA-256 digests of each namespace item) - the same
 * digest-then-sign design real ISO 18013-5 mdocs use, minus the X.509/IACA chain.
 */
export async function issue(claims: Record<string, unknown>, expirationDate?: string): Promise<MdocIssueResult> {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const publicJwk = publicKey.export({ format: 'jwk' });

  const items: { encoded: Buffer; digestID: number; elementIdentifier: string }[] = [];
  let digestID = 0;
  for (const [elementIdentifier, elementValue] of Object.entries(claims)) {
    const random = crypto.randomBytes(16);
    const item = { digestID, random, elementIdentifier, elementValue };
    const encoded = await cborEncode(item);
    items.push({ encoded, digestID, elementIdentifier });
    digestID++;
  }

  const valueDigests: Record<string, Buffer> = {};
  for (const item of items) {
    valueDigests[String(item.digestID)] = crypto.createHash('sha256').update(item.encoded).digest();
  }

  const signed = new Date();
  const validUntil = expirationDate ? new Date(expirationDate) : new Date(signed.getTime() + 365 * 24 * 60 * 60 * 1000);
  const mso = {
    docType: DOC_TYPE,
    validityInfo: { signed: signed.toISOString(), validFrom: signed.toISOString(), validUntil: validUntil.toISOString() },
    valueDigests: { [NAMESPACE]: valueDigests },
  };
  const payloadBytes = await cborEncode(mso);

  const protectedHeader = await cborEncode({ 1: COSE_ALG_ES256 });
  const toSign = await sigStructure(protectedHeader, payloadBytes);
  const derSig = crypto.sign(null, toSign, { key: privateKey, dsaEncoding: 'ieee-p1363' });

  const issuerAuth = [protectedHeader, { [HEADER_LABEL_ISSUER_JWK]: JSON.stringify(publicJwk) }, payloadBytes, derSig];

  const issuerSigned = {
    nameSpaces: { [NAMESPACE]: items.map((i) => i.encoded) },
    issuerAuth,
  };

  const mdocBase64 = (await cborEncode(issuerSigned)).toString('base64');
  return { mdocBase64, publicJwk };
}

export type VerificationOutcome = {
  valid: boolean;
  errorCode: string | null;
  errorDetail: string | null;
  checks: Record<string, boolean>;
};

export async function verify(mdocBase64: string): Promise<VerificationOutcome> {
  const checks: Record<string, boolean> = { signature: false, not_expired: false, digests_match: false };

  let issuerSigned: any;
  try {
    issuerSigned = cborDecode(Buffer.from(mdocBase64, 'base64'));
  } catch (err: any) {
    return { valid: false, errorCode: 'UNKNOWN_ERROR', errorDetail: `Malformed mdoc CBOR: ${err.message}`, checks };
  }

  const [protectedHeader, unprotectedHeader, payloadBytes, signature] = issuerSigned.issuerAuth;
  let mso: any;
  try {
    mso = cborDecode(payloadBytes);
  } catch (err: any) {
    return { valid: false, errorCode: 'UNKNOWN_ERROR', errorDetail: `Malformed MSO payload: ${err.message}`, checks };
  }

  // Expiry checked first (cheap, non-cryptographic) - consistent with the ldp_vc/SD-JWT verifiers.
  checks.not_expired = !mso.validityInfo?.validUntil || new Date(mso.validityInfo.validUntil).getTime() > Date.now();
  if (!checks.not_expired) {
    return { valid: false, errorCode: 'CREDENTIAL_EXPIRED', errorDetail: `mdoc expired at ${mso.validityInfo?.validUntil}`, checks };
  }

  try {
    const jwkJson = unprotectedHeader.get ? unprotectedHeader.get(HEADER_LABEL_ISSUER_JWK) : unprotectedHeader[HEADER_LABEL_ISSUER_JWK];
    const publicJwk = JSON.parse(jwkJson);
    const publicKey = crypto.createPublicKey({ key: publicJwk, format: 'jwk' });
    const toVerify = await sigStructure(protectedHeader, payloadBytes);
    checks.signature = crypto.verify(null, toVerify, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);
  } catch (err: any) {
    return { valid: false, errorCode: 'SIGNATURE_INVALID', errorDetail: `COSE_Sign1 verification failed: ${err.message}`, checks };
  }
  if (!checks.signature) {
    return { valid: false, errorCode: 'SIGNATURE_INVALID', errorDetail: 'COSE_Sign1 issuerAuth signature is invalid for the embedded public key', checks };
  }

  // mdoc's MSO signs digests, not raw values - so a value can be corrupted without
  // breaking issuerAuth's signature, but it WILL fail this digest check. This is a real,
  // format-accurate difference from ldp_vc/SD-JWT (where any claim mutation also breaks
  // the signature), not a simulator shortcut.
  const namespaceItems: Buffer[] = issuerSigned.nameSpaces[NAMESPACE] || [];
  const expectedDigests = mso.valueDigests?.[NAMESPACE] || {};
  const expectedMap: Record<string, Buffer> = expectedDigests instanceof Map ? Object.fromEntries(expectedDigests) : expectedDigests;
  checks.digests_match = namespaceItems.every((encoded) => {
    let item: any;
    try {
      item = cborDecode(encoded);
    } catch {
      return false;
    }
    const expected = expectedMap[String(item.digestID)];
    if (!expected) return false;
    const actual = crypto.createHash('sha256').update(encoded).digest();
    return Buffer.isBuffer(expected) ? actual.equals(expected) : actual.equals(Buffer.from(expected));
  });
  if (!checks.digests_match) {
    return { valid: false, errorCode: 'CLAIM_MISMATCH', errorDetail: 'One or more namespace items do not match their signed digest in the MSO', checks };
  }

  return { valid: true, errorCode: null, errorDetail: null, checks };
}

/** Genuinely mutates a real mdoc CBOR structure so verification fails for a concrete reason. */
export async function tamper(mdocBase64: string, tamperType: string): Promise<string> {
  const issuerSigned = cborDecode(Buffer.from(mdocBase64, 'base64'));

  if (tamperType === 'bad-signature') {
    const sig: Buffer = issuerSigned.issuerAuth[3];
    const mutated = Buffer.from(sig);
    mutated[Math.floor(mutated.length / 2)] ^= 0xff;
    issuerSigned.issuerAuth[3] = mutated;
  } else if (tamperType === 'claim-corruption') {
    const items: Buffer[] = issuerSigned.nameSpaces[NAMESPACE];
    if (items.length > 0) {
      const item = cborDecode(items[0]);
      item.elementValue = `TAMPERED_${item.elementValue}`;
      items[0] = await cborEncode(item);
    }
  } else if (tamperType === 'expired') {
    const payloadBytes: Buffer = issuerSigned.issuerAuth[2];
    const mso = cborDecode(payloadBytes);
    mso.validityInfo.validUntil = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    issuerSigned.issuerAuth[2] = await cborEncode(mso);
  }

  return (await cborEncode(issuerSigned)).toString('base64');
}
