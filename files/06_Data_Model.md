# Data Model / Schema Document

## 1. Entities

### FlowConfig
| Field | Type | Notes |
|---|---|---|
| issuer | enum | `inji-certify`, `external-mock` |
| wallet | enum | `inji-wallet-mobile`, `inji-web`, `external-mock` |
| verifier | enum | `inji-verify`, `external-mock` |
| format | enum | `w3c-vc-jsonld`, `sd-jwt-vc`, `mdoc` |
| tamperMode | boolean | default false |
| tamperType | enum/null | `claim-corruption`, `expired`, `bad-signature` |

### TestRun
| Field | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| config | FlowConfig | embedded/foreign key |
| status | enum | `in-progress`, `completed`, `failed` |
| result | enum/null | `valid`, `invalid`, `valid-but-expired` |
| startedAt | timestamp | |
| completedAt | timestamp/null | |

### ProtocolEvent
| Field | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| flowId | UUID | foreign key → TestRun |
| step | enum | `credential_offer`, `token_exchange`, `credential_issued`, `authorization_request`, `presentation`, `verification_result` |
| actor | enum | `issuer`, `wallet`, `verifier`, `bff` |
| timestamp | timestamp | |
| payload | JSON | raw request/response body |
| status | enum | `success`, `pending`, `error` |

### Report
| Field | Type | Notes |
|---|---|---|
| flowId | UUID | foreign key → TestRun |
| issuer | string | |
| wallet | string | |
| verifier | string | |
| format | string | |
| proofType | string | |
| outcome | enum | `pass`, `fail` |
| durationMs | integer | |
| errorCode | enum/null | see Error Codes table in API spec |
| errorDetail | string/null | human-readable detail |
| createdAt | timestamp | |

## 2. Relationships
```
TestRun (1) ──< ProtocolEvent (many)
TestRun (1) ──  Report (1)
```

## 3. Storage Options
- **Lightweight (hackathon-speed):** JSON files per `TestRun`, written to disk, indexed by an in-memory or flat-file catalog.
- **Structured (recommended if time allows):** SQLite or Postgres with tables `test_runs`, `protocol_events`, `reports`.
- **Redis (optional):** for live event pub/sub powering the WebSocket/SSE stream, separate from durable storage.

## 4. Example SQL Schema (Postgres)

```sql
CREATE TABLE test_runs (
  id UUID PRIMARY KEY,
  issuer TEXT NOT NULL,
  wallet TEXT NOT NULL,
  verifier TEXT NOT NULL,
  format TEXT NOT NULL,
  tamper_mode BOOLEAN DEFAULT FALSE,
  tamper_type TEXT,
  status TEXT NOT NULL,
  result TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE protocol_events (
  id UUID PRIMARY KEY,
  flow_id UUID REFERENCES test_runs(id),
  step TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE reports (
  flow_id UUID PRIMARY KEY REFERENCES test_runs(id),
  issuer TEXT NOT NULL,
  wallet TEXT NOT NULL,
  verifier TEXT NOT NULL,
  format TEXT NOT NULL,
  proof_type TEXT,
  outcome TEXT NOT NULL,
  duration_ms INTEGER,
  error_code TEXT,
  error_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL
);
```
