# Inji Interoperability Playground — Phased Technical Specification

## 0. Purpose & Scope

Build a web application ("Playground") that lets a user configure any combination of an **Issuer**, **Wallet**, and **Verifier** (starting with all three as Inji modules), run a live issue → hold → present → verify credential flow, inspect every protocol message exchanged, and generate a pass/fail interoperability report.

This spec breaks the problem statement into implementation phases, each with goals, deliverables, and exit criteria, so the team can build incrementally and demo progress at every stage.

---

## Phase 0 — Environment & Foundations

**Goal:** Get the core Inji Stack running and agree on architecture before writing playground code.

### Tasks
- Stand up Inji Certify, Mimoto + Inji Wallet (or Inji Web), and Inji Verify locally via Docker Compose, or configure access to the MOSIP Collab sandbox as a fallback.
- Verify a manual issue → hold → present → verify cycle works using the existing Inji UIs (no custom code yet).
- Set up the repo: monorepo layout with `/frontend`, `/backend` (Playground BFF), `/docs`, `/infra` (Docker Compose files).
- Choose and scaffold tech stack: React + TypeScript (Vite) + Tailwind for frontend; Node.js/Express for the BFF.
- Define shared TypeScript types/interfaces for: `FlowConfig`, `ProtocolEvent`, `CredentialFormat`, `TestResult`.

### Deliverables
- Running local stack (screenshot/log proof).
- Repo scaffold with CI lint/build pipeline.
- Architecture diagram (Frontend ↔ BFF ↔ {Certify, Mimoto/Wallet, Verify}).

### Exit Criteria
- A developer can clone the repo, run `docker compose up`, and hit health-check endpoints for all three modules.

---

## Phase 1 — Playground Shell & Component Selector

**Goal:** Build the visual "3-column selector" UI, even before wiring real flows.

### Tasks
- Build the Issuer / Wallet / Verifier selector UI (3 columns, dropdown or card-based picker per role).
- Hard-code the initial option set: Issuer = Inji Certify; Wallet = Inji Wallet (mobile) or Inji Web; Verifier = Inji Verify.
- Add a "Run Test" button (non-functional stub at this stage).
- Design the overall page layout: top = selector, middle = live flow timeline (placeholder), bottom = protocol inspector panel (placeholder).
- Set up BFF routes as stubs: `POST /api/flows`, `GET /api/flows/:id`, `GET /api/flows/:id/events`.

### Deliverables
- Static/interactive UI shell matching the wireframe in the problem statement.
- BFF skeleton with stub endpoints returning mock data.

### Exit Criteria
- User can pick a combination and click "Run Test"; UI transitions to a (mocked) live-flow view.

---

## Phase 2 — Issuance Flow (OpenID4VCI)

**Goal:** Implement the real "Issue a Credential" flow end-to-end.

### Tasks
- BFF: orchestrate calls to Inji Certify to create a credential offer (OpenID4VCI, draft 13).
- BFF: relay the offer to the selected wallet (QR code generation for mobile via deep-link/QR, or direct API call for Inji Web).
- Frontend: render the QR code / deep link, poll or use WebSocket for status updates.
- Capture and store each protocol message (credential offer, token request/response, issued credential) as `ProtocolEvent` records tied to a flow/test-run ID.
- Display live progress steps in the UI: Credential Offer → Token Exchange → Credential Issued, each with a ✓/pending/✗ state.
- Support one credential format first (start with W3C VC JSON-LD).

### Deliverables
- Working issuance flow from Certify to a real wallet instance.
- Protocol events persisted (in-memory or lightweight DB) and retrievable via API.

### Exit Criteria
- Clicking "Run Test" issues a real credential into a real wallet, and the UI shows all three issuance steps completing successfully.

---

## Phase 3 — Presentation & Verification Flow (OpenID4VP)

**Goal:** Implement "Present & Verify" and connect it to the issuance flow into one continuous journey.

### Tasks
- BFF: orchestrate the OpenID4VP request from Inji Verify (authorization request, presentation_definition).
- Wallet side: trigger credential presentation (QR-based cross-device flow to start; same-device deep-link as stretch).
- BFF: relay `vp_token` to Inji Verify and capture the verification result.
- Frontend: extend the live-flow timeline to include Authorization Request → Presentation → Verification Result.
- Map verifier output to one of: **Valid**, **Invalid**, **Valid but Expired**.
- Persist these events alongside the issuance events under the same test-run ID.

### Deliverables
- Full end-to-end flow: Issue → Hold → Present → Verify, visualized live in the UI.
- Result banner showing final outcome (🟢 Valid / 🔴 Invalid / 🟡 Expired).

### Exit Criteria
- A full cycle can be run and demoed with a real wallet and real verifier, producing a correct result banner.

---

## Phase 4 — Protocol Inspector

**Goal:** Expose the raw technical detail behind every step for developer transparency.

### Tasks
- Build a collapsible/steppable inspector panel keyed to each `ProtocolEvent`.
- For each step, display the raw JSON payload: authorization request, credential offer, token request/response, issued credential, presentation_definition, vp_token, verification result.
- Add copy-to-clipboard / pretty-print / syntax highlighting for JSON.
- (Stretch) Represent the sequence as a Mermaid.js sequence diagram driven by the same event stream, clickable per step.

### Deliverables
- Fully wired inspector panel showing real captured payloads from Phases 2–3.

### Exit Criteria
- A developer can click any step in the timeline and see the exact payload exchanged at that point, with no missing steps.

---

## Phase 5 — Multi-Format Support

**Goal:** Satisfy the mandatory "at least two credential formats end-to-end" requirement.

### Tasks
- Add SD-JWT VC as a second supported format alongside W3C VC JSON-LD.
- Add a format selector to the test configuration (per test run).
- Ensure BFF orchestration and inspector correctly label/tag events with the active format.
- Validate both formats work through the full issue → verify cycle.
- (Stretch) Add mDoc/mDL (ISO/IEC 18013-5) via Inji Certify's mock mDoc support as a third format.

### Deliverables
- Two (ideally three) credential formats working end-to-end, clearly labeled in both the timeline and reports.

### Exit Criteria
- The same flow can be run twice with different formats selected, both succeeding and both correctly labeled.

---

## Phase 6 — Interoperability Reporting

**Goal:** Produce the mandatory pass/fail report per test run.

### Tasks
- Define report schema: issuer, wallet, verifier, format, proof type, outcome, duration, error detail (if failed).
- Persist test-run results (lightweight DB — SQLite/Postgres — or structured JSON files).
- Build a report view in the UI (per-run detail + exportable summary, e.g. Markdown/JSON download).
- Add clear failure-reason surfacing (format mismatch, proof-type incompatibility, DID-method gap, QR-size limit, etc.) using structured error codes from the BFF.

### Deliverables
- Report generated automatically at the end of every test run, viewable in-app and exportable.

### Exit Criteria
- Every completed run — pass or fail — produces a structured, readable report matching the schema above.

---

## Phase 7 — Failure Modes & Negative Testing (Good-to-have)

**Goal:** Prove the playground is a debugging tool, not just a happy-path demo.

### Tasks
- Add a "Tamper Credential" mode: corrupt claims, expire the credential, or invalidate the signature before presentation.
- Confirm Inji Verify correctly rejects tampered credentials, and capture the specific error in the report/inspector.
- Document at least 2–3 real interoperability gaps discovered (format mismatch, DID method gap, QR size limit, etc.) as GitHub issues against relevant `mosip/inji-*` repos.

### Deliverables
- Working tamper mode with visibly different (failing) results in the UI.
- Written gap/bug findings, filed as issues.

### Exit Criteria
- At least one demonstrable "expected failure" scenario runs correctly through the full pipeline (tamper → invalid result → correctly reported).

---

## Phase 8 — Cross-Ecosystem Interoperability (Good-to-have)

**Goal:** Prove interoperability beyond Inji-to-Inji.

### Tasks
- Integrate a non-Inji, standards-compliant mock issuer or verifier (e.g., a Sphereon/Walt.id/DIF-style OpenID4VCI or OpenID4VP mock).
- Extend the selector matrix to include this external option for Issuer and/or Verifier roles.
- Run and report at least one full cross-ecosystem test (e.g., External Issuer → Inji Wallet → Inji Verifier).

### Deliverables
- At least one passing (or informatively failing) cross-ecosystem test case, visible in the report/matrix.

### Exit Criteria
- The compatibility matrix includes at least one non-Inji component successfully exercised end-to-end.

---

## Phase 9 — Historical Dashboard & Polish (Good-to-have / Bonus)

**Goal:** Turn individual test runs into a regression-tracking tool, and polish for demo day.

### Tasks
- Build a dashboard listing past runs, filterable by module version, format, and outcome.
- Add summary stats (total tests, pass/fail rate, most common failure).
- UI/UX polish pass: loading states, error states, responsive layout, consistent styling.
- Record the 3–5 minute demo video walking through a full cycle with the inspector visible.
- Write the README (setup, architecture, how to run each flow).

### Deliverables
- Dashboard view with filters and summary stats.
- Final README, architecture diagram, demo video.

### Exit Criteria
- All mandatory deliverables from the problem statement are present: working app, source + README, demo video, interoperability report/matrix, gap write-up.

---

## Phase 10 — Bonus / Stretch (Optional, time-permitting)

- CI-style nightly interoperability test suite against the Collab sandbox, posting a compatibility matrix automatically.
- Telemetry/observability (success rates, latency per flow) reusing Inji's Obsrv/Druid pattern.
- Package the entire playground as a one-command Docker Compose bundle.
- Same-Device OpenID4VP flow via deep link / Digital Credentials API.

---

## Suggested Timeline (example for a hackathon-length effort)

| Phase | Focus | Priority |
|---|---|---|
| 0–1 | Environment + UI shell | Must-have |
| 2–3 | Issuance + Presentation/Verification | Must-have |
| 4 | Protocol Inspector | Must-have |
| 5 | Multi-format support | Must-have |
| 6 | Interoperability report | Must-have |
| 7 | Tamper mode | Good-to-have |
| 8 | Cross-ecosystem mock | Good-to-have |
| 9 | Dashboard + polish + deliverables | Must-have (docs/video) |
| 10 | CI, telemetry, one-command deploy | Bonus |

**Recommendation:** Phases 0–6 constitute the mandatory scope from the problem statement and should be prioritized to guarantee a working, demoable submission. Phases 7–10 are differentiators to attempt only once the core loop is stable.
