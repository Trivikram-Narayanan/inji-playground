import Anthropic from '@anthropic-ai/sdk';
import { classifySandboxError } from './errorCodes';

const KNOWN_CODES = [
  'FORMAT_MISMATCH',
  'PROOF_TYPE_UNSUPPORTED',
  'QR_SIZE_EXCEEDED',
  'SIGNATURE_INVALID',
  'CLAIM_MISMATCH',
  'CREDENTIAL_EXPIRED',
  'DID_METHOD_GAP',
  'TIMEOUT',
  'UNKNOWN_ERROR',
] as const;

export type TriageResult = { errorCode: string; explanation: string; source: 'llm' | 'heuristic' };

let client: Anthropic | null | undefined;
function getClient(): Anthropic | null {
  if (client !== undefined) return client;
  client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return client;
}

/**
 * Explains a failed Real Mode step using Claude when ANTHROPIC_API_KEY is configured,
 * turning an opaque sandbox error into something a MOSIP maintainer can act on instead
 * of a bare UNKNOWN_ERROR. Always degrades to the heuristic classifier - a triage failure
 * (missing key, network error, malformed response) must never itself fail a test run.
 */
export async function triageFailure(params: { errorMessage: string; context: Record<string, unknown> }): Promise<TriageResult> {
  const heuristicCode = classifySandboxError(params.errorMessage);
  const anthropic = getClient();
  if (!anthropic) {
    return { errorCode: heuristicCode, explanation: params.errorMessage, source: 'heuristic' };
  }

  try {
    const model = process.env.TRIAGE_MODEL || 'claude-opus-5';
    const response = await anthropic.messages.create({
      model,
      max_tokens: 400,
      output_config: { effort: 'low' },
      system:
        'You are triaging a failed step in an OpenID4VCI/OpenID4VP interoperability test run against the MOSIP Inji stack (Certify/eSignet/Mimoto/Verify). ' +
        `Given the raw error message and captured protocol payloads, reply with ONLY a JSON object of the exact shape ` +
        `{"errorCode": "<one of ${KNOWN_CODES.join(', ')}>", "explanation": "<one or two plain-English sentences on the likely root cause, specific enough for a MOSIP maintainer to act on>"}. ` +
        'Pick UNKNOWN_ERROR only if none of the other codes plausibly fit. No text outside the JSON object.',
      messages: [{ role: 'user', content: JSON.stringify(params.context).slice(0, 8000) }],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const parsed = JSON.parse(textBlock?.text ?? '{}');
    const errorCode = KNOWN_CODES.includes(parsed.errorCode) ? parsed.errorCode : heuristicCode;
    const explanation = typeof parsed.explanation === 'string' && parsed.explanation ? parsed.explanation : params.errorMessage;
    return { errorCode, explanation, source: 'llm' };
  } catch {
    return { errorCode: heuristicCode, explanation: params.errorMessage, source: 'heuristic' };
  }
}
