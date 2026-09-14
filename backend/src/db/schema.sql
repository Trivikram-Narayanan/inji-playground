CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  issuer TEXT NOT NULL,
  wallet TEXT NOT NULL,
  verifier TEXT NOT NULL,
  format TEXT NOT NULL,
  tamper_mode BOOLEAN DEFAULT 0,
  tamper_type TEXT,
  status TEXT NOT NULL,
  result TEXT,
  mode TEXT NOT NULL DEFAULT 'simulated',
  holder_did TEXT,
  holder_jwk TEXT,
  raw_credential TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS protocol_events (
  id TEXT PRIMARY KEY,
  flow_id TEXT NOT NULL,
  step TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  payload TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (flow_id) REFERENCES test_runs(id)
);

CREATE TABLE IF NOT EXISTS reports (
  flow_id TEXT PRIMARY KEY,
  issuer TEXT NOT NULL,
  wallet TEXT NOT NULL,
  verifier TEXT NOT NULL,
  format TEXT NOT NULL,
  proof_type TEXT,
  outcome TEXT NOT NULL,
  duration_ms INTEGER,
  error_code TEXT,
  error_detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flow_id) REFERENCES test_runs(id)
);
