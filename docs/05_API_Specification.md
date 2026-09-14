# API Specification — Playground BFF

Base URL: `/api`

## 1. Flows

### `POST /api/flows`
Start a new test run.

**Request body:**
```json
{
  "issuer": "inji-certify | external-mock",
  "wallet": "inji-wallet-mobile | inji-web | external-mock",
  "verifier": "inji-verify | external-mock",
  "format": "w3c-vc-jsonld | sd-jwt-vc | mdoc",
  "options": {
    "tamperMode": false,
    "tamperType": null
  }
}
```

**Response:**
```json
{
  "flowId": "uuid",
  "status": "started",
  "createdAt": "2026-09-13T10:00:00Z"
}
```

### `GET /api/flows/:flowId`
Get current status/summary of a flow.

**Response:**
```json
{
  "flowId": "uuid",
  "status": "in-progress | completed | failed",
  "config": { "...": "FlowConfig" },
  "result": "valid | invalid | valid-but-expired | null",
  "startedAt": "...",
  "completedAt": "..."
}
```

### `GET /api/flows/:flowId/events`
Retrieve the full list of protocol events (for the timeline + inspector).

**Response:**
```json
{
  "flowId": "uuid",
  "events": [
    {
      "step": "credential_offer",
      "actor": "issuer",
      "timestamp": "...",
      "payload": { "...": "raw JSON" },
      "status": "success | pending | error"
    },
    {
      "step": "token_exchange",
      "actor": "wallet",
      "timestamp": "...",
      "payload": { "...": "raw JSON" },
      "status": "success"
    }
  ]
}
```

### `GET /api/flows/:flowId/events/stream` (WebSocket or SSE)
Live stream of events as they occur, for real-time timeline updates.

## 2. Reports

### `GET /api/flows/:flowId/report`
Get the interoperability report for a completed flow.

**Response:**
```json
{
  "flowId": "uuid",
  "issuer": "inji-certify",
  "wallet": "inji-wallet-mobile",
  "verifier": "inji-verify",
  "format": "sd-jwt-vc",
  "proofType": "ES256",
  "outcome": "pass | fail",
  "durationMs": 2400,
  "errorDetail": null
}
```

### `GET /api/reports`
List all past reports (for the historical dashboard), with optional query params:
`?format=sd-jwt-vc&outcome=fail&issuer=inji-certify`

**Response:** array of report objects (same shape as above).

### `GET /api/reports/export?format=markdown|json`
Export the full report set for the deliverable write-up.

## 3. Config / Metadata

### `GET /api/config/options`
Returns available Issuer/Wallet/Verifier/Format options for the selector UI (including any registered external mocks).

**Response:**
```json
{
  "issuers": ["inji-certify", "external-mock"],
  "wallets": ["inji-wallet-mobile", "inji-web", "external-mock"],
  "verifiers": ["inji-verify", "external-mock"],
  "formats": ["w3c-vc-jsonld", "sd-jwt-vc", "mdoc"]
}
```

## 4. Error Codes (structured, used in `errorDetail`)

| Code | Meaning |
|---|---|
| `FORMAT_MISMATCH` | Issuer and Verifier/Wallet disagree on credential format. |
| `PROOF_TYPE_UNSUPPORTED` | Proof/signature type not supported by the receiving party. |
| `DID_METHOD_GAP` | DID method used by issuer not resolvable/supported by verifier. |
| `QR_SIZE_EXCEEDED` | Credential/payload too large to encode in a QR code. |
| `SIGNATURE_INVALID` | Signature verification failed (tamper mode or real bug). |
| `CREDENTIAL_EXPIRED` | Credential presented after its expiry. |
| `TIMEOUT` | A step did not complete within the expected time window. |
| `UNKNOWN_ERROR` | Uncategorized failure — include raw error message. |
