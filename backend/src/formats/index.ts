import * as ldpVc from './ldpVc';
import * as sdJwt from './sdJwt';
import * as mdoc from './mdoc';
import type { FormatId } from './registry';

const SAMPLE_CLAIMS = {
  fullName: 'Jane Sample Holder',
  UIN: '9876543210',
  email: 'jane.holder@example.com',
  gender: 'Female',
  dateOfBirth: '1990-01-01',
};

/** Issues a Simulated-Mode credential using the real format-specific module for `formatId`. */
export async function issueByFormat(formatId: FormatId, expirationDate?: string): Promise<any> {
  if (formatId === 'sd-jwt-vc') return (await sdJwt.issue(SAMPLE_CLAIMS, expirationDate)).sdJwt;
  if (formatId === 'mdoc') return (await mdoc.issue(SAMPLE_CLAIMS, expirationDate)).mdocBase64;
  return (await ldpVc.issue(SAMPLE_CLAIMS, expirationDate)).credential;
}
