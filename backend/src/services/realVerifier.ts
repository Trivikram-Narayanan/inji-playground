import * as ldpVc from '../formats/ldpVc';
import * as sdJwt from '../formats/sdJwt';
import * as mdoc from '../formats/mdoc';
import type { FormatId } from '../formats/registry';

export type VerificationOutcome = {
  valid: boolean;
  errorCode: string | null;
  errorDetail: string | null;
  checks: Record<string, boolean>;
};

/** Dispatches cryptographic verification to the right format module - real or Simulated
 * Mode credentials go through the exact same verification code for a given format. */
export async function verifyCredential(format: FormatId, credential: any): Promise<VerificationOutcome> {
  if (format === 'sd-jwt-vc') return sdJwt.verify(credential as string);
  if (format === 'mdoc') return mdoc.verify(credential as string);
  return ldpVc.verify(credential);
}

/** Genuinely mutates a real signed credential so verification fails for a concrete reason. */
export async function tamperCredential(format: FormatId, credential: any, tamperType: string): Promise<any> {
  if (format === 'sd-jwt-vc') return sdJwt.tamper(credential as string, tamperType);
  if (format === 'mdoc') return mdoc.tamper(credential as string, tamperType);
  return ldpVc.tamper(credential, tamperType);
}
