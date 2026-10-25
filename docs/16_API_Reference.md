# API Reference

This is the full reference for the backend (the BFF) that powers the Inji Interoperability Playground. If you just want to poke at it, jump to the [quick tour](#a-quick-tour-with-curl) and come back for the details later.

Everything here was checked against the running server, not just the code, so the examples are real responses (IDs and timestamps shortened where it helps).

> `05_API_Specification.md` is the original design-time spec. It predates several changes (the request body is flat now, statuses are different, and there are extra endpoints). Where the two disagree, this page is the one that matches the code.

## Contents

- [The basics](#the-basics)
- [A quick tour with curl](#a-quick-tour-with-curl)
- [Endpoints](#endpoints)
  - [`GET /health`](#get-health)
  - [`GET /`](#get-)
  - [`GET /api/config/options`](#get-apiconfigoptions)
  - [`POST /api/flows`](#post-apiflows)
  - [`GET /api/flows/:id`](#get-apiflowsid)
  - [`POST /api/flows/:id/advance`](#post-apiflowsidadvance)
  - [`GET /api/flows/:id/events`](#get-apiflowsidevents)
  - [`GET /api/flows/:id/events/stream`](#get-apiflowsideventsstream-live-updates)
  - [`GET /api/flows/:id/report`](#get-apiflowsidreport)
  - [`GET /api/reports`](#get-apireports)
  - [`GET /api/reports/stats`](#get-apireportsstats)
  - [`GET /api/reports/export`](#get-apireportsexport)
  - [`GET /api/openapi.json` and `GET /api/docs`](#machine-readable-docs)
- [How a flow moves through its states](#how-a-flow-moves-through-its-states)
- [Tamper mode](#tamper-mode)
- [Real Mode vs Simulated Mode](#real-mode-vs-simulated-mode)
- [Error codes](#error-codes)
- [Configuration](#configuration)
- [Known quirks](#known-quirks)

---

## The basics

| | |
|---|---|
| **Local base URL** | `http://localhost:3000` (API routes live under `/api`) |
| **Hosted base URL** | `https://inji-playground.onrender.com` |
| **Format** | JSON in, JSON out (the Markdown export and the SSE stream are the two exceptions) |
| **Auth** | None. It's a public playground and the sandbox identity is a shared mock one. |
| **CORS** | Controlled by `CORS_ALLOWED_ORIGINS`. Unset or `*` means any origin is allowed. |
| **Rate limits** | None built in. |

Two things worth knowing up front:

1. **Timestamps are UTC but have no `Z`.** They look like `2026-10-25 16:40:16` (that's SQLite's `CURRENT_TIMESTAMP`). Treat them as UTC when you parse them. Plain `new Date("2026-10-25 16:40:16")` in JavaScript will read it as *local* time and be off by your timezone offset.
2. **Field naming is mixed.** Request bodies and `flowId` on creation use camelCase. Database-backed responses (`GET /flows/:id`, reports, events) use snake_case, because they're rows straight from the database. The tables below call this out.

---

## A quick tour with curl

Run one complete test, issue a credential, tamper with it, verify it, and read the verdict:

```bash
B=http://localhost:3000/api

# 1. Start a run (Simulated Mode is the default)
curl -s -X POST $B/flows -H 'Content-Type: application/json' -d '{
  "issuer": "inji-certify",
  "wallet": "inji-wallet-mobile",
  "verifier": "inji-verify",
  "format": "sd-jwt-vc",
  "tamperMode": true,
  "tamperType": "expired"
}'
# → {"flowId":"f45cb3fc-…","status":"OFFER_CREATED","offer":{…},"mode":"simulated"}

# 2. Push it the rest of the way: token exchange → issue → present → verify
curl -s -X POST $B/flows/<flowId>/advance
# → {"status":"COMPLETED","result":"valid-but-expired"}

# 3. Read the verdict
curl -s $B/flows/<flowId>/report
# → {"outcome":"fail","error_code":"CREDENTIAL_EXPIRED", …}
```

That's the whole lifecycle: **create → advance → report**. Everything else is for watching it happen, listing past runs, or exporting.

---

## Endpoints

### `GET /health`

Liveness check. Used by Render's health probe.

```json
{ "status": "ok" }
```

### `GET /`

A small service banner with links to the main routes.

```json
{
  "service": "Inji Interoperability Playground BFF API",
  "status": "online",
  "version": "v2.0-sec_audit",
  "docs": "/api/docs",
  "health": "/health",
  "endpoints": { "config": "/api/config/options", "flows": "/api/flows", "reports": "/api/reports" }
}
```

---

### `GET /api/config/options`

What the UI uses to build its dropdowns. Call this if you want to know which actors and formats the server currently accepts, and which formats can run in Real Mode.

```json
{
  "issuers":   ["inji-certify", "external-mock"],
  "wallets":   ["inji-wallet-mobile", "inji-web", "external-mock"],
  "verifiers": ["inji-verify", "external-mock"],
  "formats": [
    { "id": "w3c-vc-jsonld", "label": "W3C VC (JSON-LD)", "realModeSupported": true  },
    { "id": "sd-jwt-vc",     "label": "SD-JWT VC",        "realModeSupported": false },
    { "id": "mdoc",          "label": "mDoc / mDL",       "realModeSupported": true  }
  ],
  "realMode": { "mockUin": "5860356276" }
}
```

`realModeSupported: false` means there's no sandbox issuer for that format, so a Real Mode request for it is rejected straight away (see [`FORMAT_MISMATCH`](#error-codes)).

---

### `POST /api/flows`

Starts a test run. In Simulated Mode this creates the run and the credential offer. In Real Mode it also performs the live sandbox login and issuance before returning, so it can take several seconds.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `issuer` | string | yes | `inji-certify` or `external-mock` |
| `wallet` | string | yes | `inji-wallet-mobile`, `inji-web`, or `external-mock` |
| `verifier` | string | yes | `inji-verify` or `external-mock` |
| `format` | string | yes | `w3c-vc-jsonld`, `sd-jwt-vc`, or `mdoc` |
| `mode` | string | no | `simulated` (default) or `real` |
| `tamperMode` | boolean | no | Defaults to `false` |
| `tamperType` | string | no | `bad-signature`, `claim-corruption`, or `expired`. Only checked when `tamperMode` is `true`, and effectively required then (see [tamper mode](#tamper-mode)). |

> Note that `tamperMode` and `tamperType` sit at the top level, not nested under an `options` object like the old spec shows.

**Response: `201 Created` (Simulated Mode)**

```json
{
  "flowId": "f45cb3fc-086c-4148-97ef-2088ffc6f02a",
  "status": "OFFER_CREATED",
  "offer": {
    "credential_issuer": "https://inji-certify.example.com",
    "credential_configuration_ids": ["dc+sd-jwt"],
    "grants": {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": "mock_code_cf2f2343-…",
        "tx_code": { "length": 4, "input_mode": "numeric" }
      }
    }
  },
  "mode": "simulated"
}
```

**Response: `201 Created` (Real Mode)**

The sandbox issuance has already happened, so you get `CREDENTIAL_ISSUED` back and there's no `offer`:

```json
{ "flowId": "…", "status": "CREDENTIAL_ISSUED", "mode": "real" }
```

**Errors**

| Status | When | Body |
|---|---|---|
| `400` | The body failed validation | `{ "error": "Unknown format \"nope\"", "errorCode": "INVALID_REQUEST" }` |
| `502` | The run was created but failed before it could finish (a Real Mode sandbox failure, an oversized QR offer, and so on) | `{ "error": "…", "flowId": "…", "errorCode": "FORMAT_MISMATCH" }` |

The `502` still includes a `flowId` when one exists, and the failed run is saved. You can fetch its events and report like any other run, which is exactly what the UI does to show you what went wrong.

The validation messages you can get back:

```
Request body must be a JSON object
"issuer" is required and must be a non-empty string        (same for wallet, verifier, format)
Unknown issuer "x"                                          (same for wallet, verifier, format)
"mode" must be "real" or "simulated"
"tamperMode" must be a boolean
Unknown tamperType "zzz"
```

---

### `GET /api/flows/:id`

The current state of a run. This is a raw database row, so it's snake_case.

```json
{
  "id": "f45cb3fc-086c-4148-97ef-2088ffc6f02a",
  "issuer": "inji-certify",
  "wallet": "inji-wallet-mobile",
  "verifier": "inji-verify",
  "format": "sd-jwt-vc",
  "tamper_mode": 1,
  "tamper_type": "expired",
  "status": "OFFER_CREATED",
  "result": null,
  "mode": "simulated",
  "holder_did": null,
  "holder_jwk": null,
  "raw_credential": null,
  "started_at": "2026-10-25 16:40:16",
  "completed_at": null
}
```

| Field | Meaning |
|---|---|
| `status` | Where the run is. See [the state machine](#how-a-flow-moves-through-its-states). |
| `result` | `null` until it finishes, then `valid`, `invalid`, `valid-but-expired`, or `error`. |
| `tamper_mode` | `0` or `1` (SQLite has no real booleans). |
| `holder_did`, `holder_jwk`, `raw_credential` | Populated as the run progresses. `raw_credential` is the issued credential itself, so treat it as sensitive if you ever point this at real data. |

**Errors:** `404 { "error": "Flow not found" }` for an unknown ID, `500` for a database failure.

---

### `POST /api/flows/:id/advance`

Takes an issued credential the rest of the way: token exchange, issuance, the presentation request, the presentation itself (with any tampering applied), and verification. No request body.

```json
{ "status": "COMPLETED", "result": "valid" }
```

`result` is one of:

| `result` | Meaning |
|---|---|
| `valid` | Signature, claims, and validity window all check out. |
| `invalid` | Signature or claims failed. The report's `error_code` says which. |
| `valid-but-expired` | The signature is fine but the credential is past its expiry. |
| `error` | Something broke during issuance. The response is `{ "status": "FAILED", "result": "error" }`. |

Calls are not guarded against being repeated. Advancing an already-completed run runs the later steps again, so call it once per run.

**Errors:** `500 { "error": "…" }` if something unexpected throws. Verification *failures* are not errors here. They come back as `200` with `result: "invalid"`, and the detail lives in the report.

---

### `GET /api/flows/:id/events`

Every protocol event recorded for the run, oldest first. This is what powers the timeline and the Protocol Inspector.

```json
{
  "events": [
    {
      "id": "71d58a84-cddc-40e8-a255-fd1b6a557f02",
      "flow_id": "f45cb3fc-…",
      "step": "credential_offer",
      "actor": "issuer",
      "timestamp": "2026-10-25 16:40:16",
      "payload": "{\"credential_issuer\":\"https://inji-certify.example.com\", …}",
      "status": "success"
    }
  ]
}
```

Two gotchas:

- **`payload` is a JSON string, not an object.** You need to `JSON.parse` it yourself.
- Simulated runs produce six events in this order: `credential_offer`, `token_exchange`, `credential_issued`, `authorization_request`, `presentation`, `verification_result`.

`step` is one of those six names. `actor` is `issuer`, `wallet`, or `verifier`. `status` is `success` or `error`.

---

### `GET /api/flows/:id/events/stream` (live updates)

A Server-Sent Events connection that pushes updates as the run progresses, so you don't have to poll. The UI uses this for the live timeline.

```bash
curl -N http://localhost:3000/api/flows/<flowId>/events/stream
```

The connection opens with a comment line (`: connected`), then sends one `data:` line per update:

```
data: {"type":"status","flowId":"f45cb3fc-…","data":{"status":"TOKEN_EXCHANGED"}}

data: {"type":"event","flowId":"f45cb3fc-…","data":{"id":"…","step":"token_exchange","actor":"wallet","status":"success", …}}

data: {"type":"status","flowId":"f45cb3fc-…","data":{"status":"VERIFIED_VALID","result":"valid"}}
```

| `type` | `data` contains |
|---|---|
| `status` | `{ status }`, plus `result` on the terminal update. A failure carries `{ status: "FAILED", errorCode, errorDetail }`. |
| `event` | The same event row you'd get from `/events`. |

A few practical notes:

- **It only streams from the moment you connect.** It doesn't replay history. Connecting to a run that already finished just shows `: connected` and then silence. For history, use `/events`.
- Open the stream *before* you call `advance` if you want to catch everything. A typical advance sends about 10 messages (5 status changes and 5 events).
- The connection stays open until you close it. The server cleans up its subscription when you disconnect.

---

### `GET /api/flows/:id/report`

The verdict for a finished run. Only exists once a run has reached a terminal state (or failed).

```json
{
  "flow_id": "f45cb3fc-086c-4148-97ef-2088ffc6f02a",
  "issuer": "inji-certify",
  "wallet": "inji-wallet-mobile",
  "verifier": "inji-verify",
  "format": "sd-jwt-vc",
  "proof_type": "success",
  "outcome": "fail",
  "duration_ms": 2406,
  "error_code": "CREDENTIAL_EXPIRED",
  "error_detail": "SD-JWT expired at 2026-10-24T16:40:17.000Z",
  "created_at": "2026-10-25 16:40:18"
}
```

| Field | Meaning |
|---|---|
| `outcome` | `pass` or `fail`. Note that `valid-but-expired` is a `fail` here. |
| `error_code` | `null` on a pass. Otherwise one of the [error codes](#error-codes). |
| `error_detail` | A human-readable sentence about what went wrong. |
| `proof_type` | What kind of proof was exercised. `n/a` when the run failed before getting that far. |
| `duration_ms` | Time from the first event to the verdict. Never less than 1000, because of a deliberate floor. |

**Errors:** `404 { "error": "Report not found" }` if the run doesn't exist or hasn't finished.

---

### `GET /api/reports`

Every report, newest first. Optional filters go in the query string:

| Param | Example | Notes |
|---|---|---|
| `format` | `mdoc` | Exact match |
| `outcome` | `pass` | `pass` or `fail` |
| `issuer` | `inji-certify` | Exact match |

```bash
curl "http://localhost:3000/api/reports?outcome=pass&format=mdoc"
```

Returns an array of the same report objects described above.

---

### `GET /api/reports/stats`

The numbers behind the dashboard cards.

```json
{
  "totalTests": 42,
  "passed": 10,
  "failed": 32,
  "passRate": 24,
  "mostCommonError": "SIGNATURE_INVALID"
}
```

`passRate` is a whole-number percentage. `mostCommonError` is the most frequent `error_code` across failed reports.

---

### `GET /api/reports/export`

The Interoperability Matrix, in two shapes.

| Query | Returns |
|---|---|
| `?format=markdown` | A Markdown table (`Content-Type: text/markdown`) you can paste straight into an issue or README |
| `?format=json` or anything else | The same array as `GET /api/reports` |

```markdown
## Interoperability Matrix — Summary

| Issuer | Wallet | Verifier | Format | Outcome | Notes |
|---|---|---|---|---|---|
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
| external-mock | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | DID_METHOD_GAP |
```

An unrecognised `format` value (say `?format=xml`) doesn't error. It quietly falls back to JSON.

---

### Machine-readable docs

| Route | What you get |
|---|---|
| `GET /api/openapi.json` | The OpenAPI 3.0 spec as JSON, for importing into Postman, Insomnia, or a code generator |
| `GET /api/docs` | Swagger UI, served as a page, for trying requests in the browser |

The OpenAPI file is hand-maintained in `backend/src/openapi.ts`. If this page and that file ever disagree, trust the code in `backend/src/routes/`.

---

## How a flow moves through its states

A run's `status` walks through these in order:

```
CREATED → OFFER_CREATED → TOKEN_EXCHANGED → CREDENTIAL_ISSUED
        → AUTH_REQUESTED → PRESENTED → VERIFIED_VALID
                                     ↘ VERIFIED_INVALID
                                     ↘ VERIFIED_EXPIRED
```

At any point it can drop into `FAILED` instead (with `result: "error"`). The three `VERIFIED_*` states and `FAILED` are *terminal*. Nothing moves after them.

| Status | What happened |
|---|---|
| `CREATED` | The run exists. Nothing else yet. |
| `OFFER_CREATED` | The credential offer is ready (the QR payload). Simulated Mode stops here until you call `advance`. |
| `TOKEN_EXCHANGED` | The wallet traded the pre-authorized code for an access token. |
| `CREDENTIAL_ISSUED` | A real signed credential now exists. Real Mode jumps straight here from `POST /flows`. |
| `AUTH_REQUESTED` | The verifier sent its presentation request. |
| `PRESENTED` | The wallet answered with the (possibly tampered) credential. |
| `VERIFIED_VALID` / `_INVALID` / `_EXPIRED` | The verifier's verdict. |
| `FAILED` | A step errored or exceeded `STEP_TIMEOUT_MS`. The report carries a `TIMEOUT` code if it was the clock. |

---

## Tamper mode

Tamper mode corrupts the credential *after* it's been legitimately issued and *before* it reaches the verifier, to prove the verifier notices. In Real Mode it mutates the genuinely signed credential, so the failures are real, not scripted.

| `tamperType` | What it does |
|---|---|
| `bad-signature` | Flips the signature so it no longer verifies |
| `claim-corruption` | Changes a claim value after signing |
| `expired` | Backdates the validity window so the credential is already past its expiry |

**Always send `tamperType` with `tamperMode: true`.** There's no default. If you leave it out, nothing is actually changed and the run comes back `valid`, which looks like a pass but tested nothing.

**What to expect per format.** These are deterministic, and they're the core regression matrix:

| Format | Tamper | `result` | `error_code` |
|---|---|---|---|
| any | off | `valid` | none |
| any | `expired` | `valid-but-expired` | `CREDENTIAL_EXPIRED` |
| any | `bad-signature` | `invalid` | `SIGNATURE_INVALID` |
| W3C VC (JSON-LD) | `claim-corruption` | `invalid` | `SIGNATURE_INVALID` |
| SD-JWT VC | `claim-corruption` | `invalid` | `CLAIM_MISMATCH` |
| mDoc / mDL | `claim-corruption` | `invalid` | `CLAIM_MISMATCH` |

The W3C row is not a bug. JSON-LD signs the entire document as one unit, so it can't tell a changed claim apart from a bad signature. SD-JWT and mDoc sign digests of the claims separately, which is why they can report `CLAIM_MISMATCH` while the signature itself is still valid.

One more built-in scenario: with `issuer: "external-mock"`, `wallet: "inji-wallet-mobile"` and `format: "w3c-vc-jsonld"`, the run fails with `DID_METHOD_GAP`. That's the cross-ecosystem case where the issuer's DID method isn't one the wallet understands.

---

## Real Mode vs Simulated Mode

| | Simulated (default) | Real |
|---|---|---|
| Set with | `"mode": "simulated"` or omit it | `"mode": "real"` |
| Network | None | Live calls to the MOSIP Collab sandbox |
| Speed | A couple of seconds | Slower, with retries |
| Formats | All three | `w3c-vc-jsonld` and `mdoc` only |
| After `POST /flows` | `OFFER_CREATED` | `CREDENTIAL_ISSUED` (issuance already done) |
| Determinism | Fully deterministic | Depends on someone else's servers |

Real Mode logs in headlessly with the sandbox's mock identity (UIN `5860356276`, OTP `111111`), exchanges tokens through the Mimoto BFF, and gets a real signed credential from the format's Certify host. Verification is then done locally with real cryptography.

**Heads up:** at the time of writing, the sandbox itself fails at the `send-otp` step with `invalid_transaction`. That's a MOSIP-side issue, not something this API can fix. You'll get a `502` with a clear message and a saved, inspectable failed run. Simulated Mode is unaffected.

---

## Error codes

These appear as `error_code` on reports and as `errorCode` on failed start requests.

| Code | Meaning | Typical cause |
|---|---|---|
| `INVALID_REQUEST` | The request body didn't validate | Missing field, unknown actor/format, wrong type. Returned as `400`. |
| `FORMAT_MISMATCH` | The requested format can't be done in this mode | SD-JWT VC in Real Mode |
| `PROOF_TYPE_UNSUPPORTED` | The issuer or wallet doesn't support the proof type needed | Proof-related sandbox rejection |
| `QR_SIZE_EXCEEDED` | The offer is too big to fit in a QR code | Oversized credential offer |
| `SIGNATURE_INVALID` | The cryptographic signature didn't verify | `bad-signature` tamper, or W3C claim corruption |
| `CLAIM_MISMATCH` | A claim doesn't match its signed digest | `claim-corruption` on SD-JWT or mDoc |
| `CREDENTIAL_EXPIRED` | Valid signature, but past its expiry | `expired` tamper |
| `DID_METHOD_GAP` | The issuer's DID method isn't supported by the wallet | `external-mock` issuer with the W3C format |
| `TIMEOUT` | A step took longer than `STEP_TIMEOUT_MS` | Slow or hung sandbox |
| `UNKNOWN_ERROR` | Anything that didn't match the above | Includes the sandbox `invalid_transaction` failure |

If `ANTHROPIC_API_KEY` is set, failed Real Mode steps get an AI-written explanation of the likely root cause. Without a key, a built-in heuristic classifier is used instead, and the API behaves identically either way.

---

## Configuration

Set these in `backend/.env` (copy `backend/.env.example` to start). Every one has a working default, so a fresh checkout runs with no `.env` at all.

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `CORS_ALLOWED_ORIGINS` | any origin | Comma-separated list of allowed frontend origins, or `*` |
| `STEP_TIMEOUT_MS` | `30000` | Per-step ceiling before a run fails with `TIMEOUT` |
| `MIMOTO_BASE_URL` | MOSIP Collab Mimoto | Sandbox BFF used in Real Mode |
| `MOCK_UIN` / `MOCK_OTP` | `5860356276` / `111111` | The sandbox's public mock identity |
| `SANDBOX_TIMEOUT_MS` | `15000` | HTTP timeout for each sandbox call |
| `SANDBOX_TXN_RETRIES` | `3` | Retries for the sandbox's flaky transaction cache |
| `SANDBOX_REDIRECT_URI`, `SANDBOX_ACR_VALUES` | Sandbox defaults | OIDC details for the headless login |
| `REAL_<PREFIX>_*` | Sandbox defaults | Per-format issuer overrides (`JSONLD`, `MDOC`, `SDJWT`). Set `REAL_<PREFIX>_ENABLED=false` to switch a format off in Real Mode. |
| `ANTHROPIC_API_KEY` | unset | Turns on AI-assisted failure explanations |
| `TRIAGE_MODEL` | see `.env.example` | Which model writes those explanations |

---

## Known quirks

Things that look odd but are currently how it works, so you don't lose an afternoon to them:

- **`payload` in `/events` is a string**, not an object. Parse it.
- **Timestamps are UTC without a `Z`.** Append one before parsing.
- **`tamper_mode` is `0`/`1`**, not `true`/`false`, on read.
- **Re-advancing a finished run** re-runs the later steps instead of rejecting the call.
- **`/reports/export?format=<anything-else>`** returns JSON rather than an error.
- **Reports and runs live in a local SQLite file** (`backend/data/playground.sqlite`). On Render's free tier that file doesn't survive a redeploy, so the dashboard history resets.
- **Free-tier cold starts.** The hosted backend can take a while to wake up on the first request after being idle.
- **Real Mode depends on a third party.** See above.
