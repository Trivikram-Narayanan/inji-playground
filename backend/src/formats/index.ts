import * as ldpVc from './ldpVc';
import * as sdJwt from './sdJwt';
import * as mdoc from './mdoc';
import type { FormatId } from './registry';
import type { DidMethod } from '../ecosystems/registry';

const SAMPLE_CLAIMS = {
  fullName: 'Jane Sample Holder',
  UIN: '9876543210',
  email: 'jane.holder@example.com',
  gender: 'Female',
  dateOfBirth: '1990-01-01',
};

/**
 * Issues a Simulated-Mode credential using the real format-specific module for `formatId`.
 * `didMethod` only applies to w3c-vc-jsonld (ldp_vc uses DID-based issuer identity); it's
 * ignored for sd-jwt-vc/mdoc, which sign with a format-native key mechanism instead.
 */
export async function issueByFormat(formatId: FormatId, expirationDate?: string, didMethod?: DidMethod): Promise<any> {
  if (formatId === 'sd-jwt-vc') return (await sdJwt.issue(SAMPLE_CLAIMS, expirationDate)).sdJwt;
  if (formatId === 'mdoc') return (await mdoc.issue(SAMPLE_CLAIMS, expirationDate)).mdocBase64;
  return (await ldpVc.issue(SAMPLE_CLAIMS, expirationDate, didMethod)).credential;
}
