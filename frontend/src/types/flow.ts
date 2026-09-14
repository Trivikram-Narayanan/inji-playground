export interface FlowEvent {
  id: string;
  step: string;
  actor: string;
  timestamp: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'error';
}

export interface FlowStatus {
  id: string;
  status: string;
  mode?: string;
  result?: 'valid' | 'invalid' | 'valid-but-expired';
  offer?: {
    credential_issuer: string;
    credential_configuration_ids?: string[];
    grants?: Record<string, unknown>;
  };
  events: FlowEvent[];
}

export interface InteropReport {
  id?: string;
  flow_id: string;
  issuer: string;
  wallet: string;
  verifier: string;
  format: string;
  proof_type?: string;
  outcome: 'pass' | 'fail';
  duration_ms: number;
  error_code?: string;
  error_detail?: string;
  created_at: string;
}

export interface FlowActorOption {
  id: string;
  name: string;
}

export interface FlowOptions {
  issuers: (string | FlowActorOption)[];
  wallets: (string | FlowActorOption)[];
  verifiers: (string | FlowActorOption)[];
  formats: { id: string; label: string; realModeSupported: boolean }[];
  realMode: { mockUin: string };
}

export type CredentialState = 'blank' | 'sealed' | 'transit' | 'verified' | 'rejected' | 'pending';
