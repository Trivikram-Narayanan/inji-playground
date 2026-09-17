export type FlowConfig = {
  issuer: string;
  wallet: string;
  verifier: string;
  format: string;
  tamperMode?: boolean;
  tamperType?: 'claim-corruption' | 'bad-signature' | 'expired' | string;
  mode?: 'real' | 'simulated';
};

export type FormatOption = {
  id: string;
  label: string;
  realModeSupported: boolean;
};

export type ConfigOptions = {
  issuers: string[];
  wallets: string[];
  verifiers: string[];
  formats: FormatOption[];
  realMode: { mockUin: string };
};

export type FlowEvent = {
  id: string;
  step: 'credential_offer' | 'token_exchange' | 'credential_issued' | 'authorization_request' | 'presentation' | 'verification_result' | string;
  actor: string;
  timestamp: string;
  payload: any;
  status: 'success' | 'pending' | 'error';
};

export type FlowStatus = {
  id: string;
  status: string;
  mode?: 'real' | 'simulated' | string;
  result?: 'valid' | 'invalid' | 'expired' | string;
  offer?: any;
  events: FlowEvent[];
};

export interface InteropReport {
  flow_id: string;
  issuer: string;
  wallet: string;
  verifier: string;
  format: string;
  proof_type: string;
  outcome: 'pass' | 'fail';
  duration_ms: number;
  error_code?: string;
  error_detail?: string;
  created_at: string;
}

export const TERMINAL_STATUSES = [
  'VERIFIED_VALID',
  'VERIFIED_INVALID',
  'VERIFIED_EXPIRED',
  'FAILED'
] as const;

export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export const PROTOCOL_STEPS = [
  { id: 'credential_offer', label: 'Credential Offer Created', actor: 'ISSUER' },
  { id: 'token_exchange', label: 'Token Exchanged', actor: 'WALLET' },
  { id: 'credential_issued', label: 'Credential Issued', actor: 'ISSUER' },
  { id: 'authorization_request', label: 'Presentation Requested', actor: 'VERIFIER' },
  { id: 'presentation', label: 'Credential Presented', actor: 'WALLET' },
  { id: 'verification_result', label: 'Verification Complete', actor: 'VERIFIER' },
] as const;
