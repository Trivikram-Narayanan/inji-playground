# 13. Recent Pull Changelog & Architecture Updates

This document details the features, architectural enhancements, and fixes brought in by the recent pull (`32d251b..54e4105`), integrating team contributions into a unified release.

---

## 1. Summary of Pull Highlights

| Area | Feature / Enhancement | Impact |
|---|---|---|
| **Real Mode** | Config-Driven Issuer Resolution | Self-hosters can point Real Mode to custom Certify/eSignet instances via env vars without touching source code. |
| **Diagnostics** | LLM-Based Failure Triage Engine | Uses Claude (`@anthropic-ai/sdk`) to analyze captured protocol payloads on failure, with heuristic fallback. |
| **Database** | Embedded TypeScript Schema | Solves `tsc` omitting `schema.sql` in production/Docker builds; enables mountable `data/` SQLite volume. |
| **Security & Config** | Configurable CORS & Dotenv Order | Fixes dotenv evaluation timing and locks down allowed CORS origins via `CORS_ALLOWED_ORIGINS`. |
| **Testing & QA** | Interactive QA HTML & Sandbox Bug Report | Adds in-browser interactive QA checklist (`testing.html`) and upstream MOSIP eSignet bug report (`mosip-sandbox-bug-report.md`). |
| **Integration** | Teammate Merge | Merged with Mermaid sequence diagram, same-device flow, and GitHub Actions CI matrix runner. |

---

## 2. Config-Driven Real Mode & Self-Hosting

### 2.1 The Problem
Previously, Real Mode configuration was hardcoded to the public MOSIP Collab sandbox hosts (`api.collab.mosip.net`, `esignet-mosipid.collab.mosip.net`). This prevented organizations deploying their own local Inji stack from using Real Mode against their own infrastructure.

### 2.2 The Solution
`backend/src/formats/registry.ts` now dynamically resolves issuer configuration on a per-format basis via environment variables:
- `REAL_W3C_VC_JSONLD_ISSUER_HOST`, `REAL_W3C_VC_JSONLD_CLIENT_ID`, `REAL_W3C_VC_JSONLD_SCOPE`, etc.
- `REAL_SD_JWT_VC_*`
- `REAL_MDOC_*`

If the format-specific env vars are absent, it falls back to the default MOSIP Collab sandbox settings. Once a team deploys an SD-JWT issuer, they can enable it simply by declaring `REAL_SD_JWT_VC_ISSUER_HOST` in `.env` without modifying code.

---

## 3. LLM-Based Failure Triage Engine

### 3.1 File: `backend/src/services/failureTriage.ts`
When testing against external sandbox environments, upstream errors can be cryptic (e.g., bare HTTP 500s or `invalid_transaction`).

### 3.2 Key Behaviors:
- **Claude Analysis**: When `ANTHROPIC_API_KEY` is provided, the engine sends the captured protocol context (payloads, headers, and step state) to Anthropic Claude (`claude-opus-5` or `TRIAGE_MODEL`).
- **Structured Output**: Returns structured JSON with `{ errorCode, explanation, source: 'llm' }`, offering plain-English explanations targeted for MOSIP maintainers.
- **Resilient Fallback**: If no API key is configured, or if the network request fails, it automatically degrades to the deterministic heuristic classifier (`source: 'heuristic'`). Test runs **never** fail because of a triage error.
- **Unit Tested**: Verified in `backend/src/services/failureTriage.test.ts` (passing test suite expanded to 24 tests).

---

## 4. Production Database & Schema Fix

### 4.1 Root Cause
In Node.js/TypeScript projects, running `npm run dev` with `tsx` reads directly from `src/`, including `src/db/schema.sql`. However, during a production build (`tsc -p tsconfig.json`), the TypeScript compiler compiles `.ts` files into `dist/` but **omits non-TypeScript assets** like `.sql` files. Consequently, running `npm run build && npm start` in Docker silently failed to find `schema.sql` and initialized an empty database with no tables.

### 4.2 Fix: `backend/src/db/schema.ts`
The database schema is now defined as an exported TypeScript string constant (`SCHEMA_SQL`).
- Both `tsx` (development) and `node dist/index.js` (production container) bundle the schema natively.
- The default SQLite database path was relocated to a dedicated `data/` directory (`data/playground.sqlite`), allowing clean Docker volume binding.

---

## 5. Security & Configuration Fixes

1. **Dotenv Loading Order (`backend/src/index.ts`)**:
   - Previously, `import dotenv from 'dotenv'; dotenv.config();` ran after other module imports, meaning any service evaluating `process.env` at module-evaluation time read undefined values.
   - Now, dotenv initialization runs at the very top before application imports are evaluated.
2. **CORS Restrictions (`backend/src/app.ts`)**:
   - Replaced wildcard CORS with support for `CORS_ALLOWED_ORIGINS`, defaulting to local frontend origins (`http://localhost:5173`, `http://localhost:5175`).
3. **Frontend API Base (`frontend/src/`)**:
   - Replaced hardcoded `http://localhost:3000/api` strings with `import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'`, enabling clean container routing.

---

## 6. Testing & Documentation Suite Additions

- **[`docs/TESTING.md`](docs/TESTING.md)**: Exhaustive manual and API regression test plan covering all 13 format × tamper cases, Real Mode expectations, and API spot checks.
- **[`docs/testing.html`](docs/testing.html)**: Interactive, client-side HTML testing dashboard with local-storage saved checkboxes, dark/light theme, and direct verification notes.
- **[`docs/mosip-sandbox-bug-report.md`](docs/mosip-sandbox-bug-report.md)**: Formal bug report documenting the MOSIP eSignet transaction-cache drop bug between `oauth-details` and `send-otp`.

---

## 7. Verification Status After Merge

```bash
node --import tsx --test (Get-ChildItem -Path src -Recurse -Filter "*.test.ts").FullName
# Result: 24 tests passed, 0 failures (100%)
```

Both development dev servers and container configurations are operating with zero regressions.
