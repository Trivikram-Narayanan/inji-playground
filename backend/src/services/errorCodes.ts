/**
 * Best-effort classification of an opaque upstream error message into the structured
 * vocabulary from 05_API_Specification.md §4, so real (not fabricated) sandbox failures
 * still surface a meaningful errorCode instead of always falling back to UNKNOWN_ERROR.
 */
export function classifySandboxError(message: string): string {
  const m = (message || '').toLowerCase();
  if (m.includes('proof')) return 'PROOF_TYPE_UNSUPPORTED';
  if (m.includes('credential_configuration') || m.includes('format') || m.includes('unsupported_credential_type')) return 'FORMAT_MISMATCH';
  if (m.includes('expired')) return 'CREDENTIAL_EXPIRED';
  if (m.includes('signature')) return 'SIGNATURE_INVALID';
  return 'UNKNOWN_ERROR';
}
