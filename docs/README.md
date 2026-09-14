# Inji Interoperability Playground

The **Inji Interoperability Playground** is a comprehensive, open-source testing sandbox designed to simulate and debug cross-module Verifiable Credential (VC) flows within the MOSIP ecosystem (and external ecosystems). It serves as a visual wrapper around Inji Certify and Inji Verify logic, providing real-time protocol transparency.

## Architecture

- **Frontend**: Built with React, TypeScript, Vite, and TailwindCSS. The UI provides a configuration selector, live protocol timeline, protocol inspector, and a historical reporting dashboard.
- **Backend (BFF)**: Built with Node.js, Express, and SQLite. Acts as an orchestrator that simulates OpenID4VCI (Issuance) and OpenID4VP (Presentation & Verification) flows. It persists test states (`TestRun`), events (`ProtocolEvent`), and reports (`Report`).


## Features

- **Component Mocking**: Mix and match `Inji Certify`, `Inji Wallet`, `Inji Verify`, and `External Mocks` for true cross-ecosystem testing.
- **Format Support**: Test interactions with W3C VC JSON-LD, SD-JWT VC, and mDoc.
- **Live Timeline & Animated Mermaid Sequence Diagram**: Visually tracks the credential lifecycle from Offer to Verification Result, with interactive Mermaid.js protocol diagrams.
- **Same-Device & Cross-Device Flows**: Test both QR-code cross-device scans and direct `openid4vp://` / `inji://` same-device deep-link handoffs.
- **Protocol Inspector**: Allows developers to view the beautifully syntax-highlighted raw JSON payloads (Token Exchanges, Submissions) for each step of the flow.
- **Tamper Mode (Negative Testing)**: Intentionally corrupt claims, invalidate signatures, or expire credentials to test the verifier's resilience.
- **Interoperability Reporting**: At the end of every flow, an Interoperability Report is generated, logging execution details, durations, outcomes, and error codes.
- **Historical Dashboard**: See aggregated pass/fail rates, total runs, most common errors, and view a history of all executed scenarios.
- **Automated CI Matrix Runner**: GitHub Actions workflow that executes all 13 format × tamper scenarios and generates the compatibility matrix.

## Getting Started

### Option A: One-Command Docker Compose (Recommended)

```bash
docker compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend BFF: `http://localhost:3000`

### Option B: Local Node.js Setup

#### Prerequisites
- Node.js (v18+)
- npm

#### 1. Start the Backend (BFF)
The backend orchestrator and SQLite database run here.

```bash
cd backend
npm install
npm run dev
```
The backend server will start at `http://localhost:3000`.

#### 2. Start the Frontend
The React application provides the visual interface.

```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.


## How to Test

1. Navigate to `http://localhost:5173` in your browser.
2. Select your desired **Issuer**, **Wallet**, and **Verifier**.
3. Choose the **Format** (e.g., W3C VC JSON-LD).
4. Optionally toggle **Tamper Mode** for negative testing.
5. Click **Run Test**.
6. When the "Credential Offer Created" step appears, click **Simulate Full Flow (Hackathon Mode)**.
7. Click any event in the timeline (like "Token Exchanged") to inspect the payload in the **Protocol Inspector**.
8. At the end of the flow, click **View Full Report** to see the final outcome.
9. Click **Dashboard** in the top navigation bar to see your historical execution stats.

## Real Mode

Toggle **Real Mode** in the Selector to run against the real, publicly-hosted **MOSIP Collab sandbox** instead of the built-in simulator:

- **Issuance**: a genuine headless OIDC login (mock UIN `5860356276`, mock OTP `111111`) against the format's real eSignet host, token exchange via the real `api.collab.mosip.net` Mimoto BFF, and a real signed credential from the format's real Certify host. Every raw request/response is captured in the Protocol Inspector.
- **Verification**: this BFF acts as its own OpenID4VP relying party and runs real cryptographic verification against the credential it just received. Tamper Mode genuinely mutates the signed/encoded credential before verification, so failures are real, not scripted.
- **Format coverage**: verified against the live sandbox — only `w3c-vc-jsonld` (`Mosip` issuer, `ldp_vc`) and `mdoc` (`MockMdl` issuer, `mso_mdoc`) have a real sandbox issuer today. `sd-jwt-vc` has none; requesting it in Real Mode fails immediately with `FORMAT_MISMATCH` rather than faking it (Simulated Mode supports all three).
- **Known caveat**: the sandbox's pre-auth transaction cache has been observed to intermittently lose a transaction between calls (a MOSIP-side infra issue, also reported on their community forum, not something this app can fix). Real Mode retries automatically and fails cleanly with the raw error visible in the inspector — switch to Simulated Mode (the toggle default) if the sandbox is having a bad day.

Config lives in `backend/.env` (see `backend/.env.example`) — the sandbox URLs and mock identity are public/pre-configured, no credentials needed.

## Multi-Format Support

All three formats are genuinely implemented (real signing/encoding, real verification, real tamper-evidence), not just labels on the same mock payload — see `backend/src/formats/`:

| Format | Simulated Mode | Real Mode | Tamper-mode nuance |
|---|---|---|---|
| W3C VC (JSON-LD) | Real `Ed25519Signature2020`-signed credential (self-certifying `did:key`) | Real MOSIP Certify issuance (`Mosip` issuer) | Any claim mutation also breaks the signature (JSON-LD signs the whole document) |
| SD-JWT VC | Real IETF SD-JWT (`_sd` digests + disclosures, EdDSA-signed) | Not available on the sandbox (`FORMAT_MISMATCH`) | Claim corruption fails via digest mismatch *without* breaking the JWT signature |
| mDoc / mDL | Real CBOR `IssuerSigned` + `COSE_Sign1` (ES256) | Real MOSIP Certify issuance (`MockMdl` issuer) | Same digest/signature separation as SD-JWT (MSO signs digests, not raw values) |

## API Surface

Beyond the flow/report endpoints, per `files/05_API_Specification.md`:
- `GET /api/config/options` — issuer/wallet/verifier/format lists (drives the Selector; no more hardcoded arrays).
- `GET /api/flows/:id/events/stream` — Server-Sent Events live feed of state transitions and protocol events for one flow.
- `GET /api/reports/export?format=markdown|json` — the Interoperability Matrix in either shape.
- Structured error codes (`FORMAT_MISMATCH`, `PROOF_TYPE_UNSUPPORTED`, `QR_SIZE_EXCEEDED`, `SIGNATURE_INVALID`, `CLAIM_MISMATCH`, `CREDENTIAL_EXPIRED`, `DID_METHOD_GAP`, `TIMEOUT`, `UNKNOWN_ERROR`) on every failed report.

Test-run state follows the full lifecycle in `files/07_State_Machine.md` (`CREATED → OFFER_CREATED → TOKEN_EXCHANGED → CREDENTIAL_ISSUED → AUTH_REQUESTED → PRESENTED → VERIFIED_VALID|VERIFIED_INVALID|VERIFIED_EXPIRED`, or `FAILED` with a `TIMEOUT`-coded report if a step exceeds `STEP_TIMEOUT_MS`).

## Tests

```bash
cd backend
npm test
```

Unit tests cover each format module's issue → verify round-trip and tamper-mode failure modes (`src/formats/*.test.ts`), timeout/error-classification helpers (`src/services/*.test.ts`), and one integration test (`src/app.test.ts`) that boots the Express app in-process and runs a full flow through `POST /api/flows` → `advance` → `report`.

## Documentation Index

Full specification suite lives in [`files/`](files/):

| Doc | Purpose |
|---|---|
| [`01_PRD.md`](files/01_PRD.md) | Product requirements & scope |
| [`02_Glossary.md`](files/02_Glossary.md) | Terminology reference |
| [`03_Architecture.md`](files/03_Architecture.md) | System architecture |
| [`04_Sequence_Diagrams.md`](files/04_Sequence_Diagrams.md) | Protocol flow diagrams |
| [`05_API_Specification.md`](files/05_API_Specification.md) | BFF API contract |
| [`06_Data_Model.md`](files/06_Data_Model.md) | Schema & entities |
| [`07_State_Machine.md`](files/07_State_Machine.md) | Test-run lifecycle states |
| [`08_Environment_Setup_Guide.md`](files/08_Environment_Setup_Guide.md) | Local/sandbox setup |
| [`09_Test_Plan.md`](files/09_Test_Plan.md) | Test matrix & cases |
| [`10_Report_Templates.md`](files/10_Report_Templates.md) | Report & gap write-up formats |
| [`12_Enhancements_And_Extensions.md`](files/12_Enhancements_And_Extensions.md) | Mermaid diagrams, same-device flow, Docker, and CI matrix |
| [`13_Recent_Pull_Changelog_And_Architecture_Updates.md`](13_Recent_Pull_Changelog_And_Architecture_Updates.md) | Recent pull changelog & architecture updates |
| [`14_Award_Level_Creative_Direction.md`](14_Award_Level_Creative_Direction.md) | Creative direction, motion design, and 3D stack spec |
| [`15_Real_World_Cinematic_Trust_Inspirations.md`](15_Real_World_Cinematic_Trust_Inspirations.md) | Case studies, studio benchmarks (Worldcoin, Jeton, Audemars Piguet), and real-world citations |
| [`Inji_Interoperability_Playground_Spec.md`](Inji_Interoperability_Playground_Spec.md) | Phased build plan |

**Known gap**: a full local Docker Compose stack for Certify/Wallet/Verify (`08_Environment_Setup_Guide.md` Option A) is out of scope on this machine (no Docker, 8GB RAM) — Real Mode uses the MOSIP Collab sandbox (Option B) instead.

## Hackathon Scope Complete
This repository implements all mandatory and stretch goals outlined for the Inji Interoperability Playground hackathon challenge (Phases 0 through 10), including a Real Mode that exercises the actual MOSIP Collab sandbox end-to-end and genuine multi-format support.
