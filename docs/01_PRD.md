# Product Requirements Document (PRD)
## Inji Interoperability Playground

### 1. Problem Statement
Real-world digital identity ecosystems need proof that Inji Certify, Inji Wallet, and Inji Verify interoperate cleanly with each other and with implementations outside MOSIP. This project builds a visual playground to test and demonstrate that interoperability.

### 2. Goals
- Give the Inji community and new integrators a hands-on way to understand and trust the stack's standards compliance.
- Surface real interoperability gaps (format mismatches, proof-type incompatibilities, DID-method gaps, QR size limits) that core teams can act on.

### 3. Non-Goals
- Not a production identity system — it's a testing/demo sandbox.
- Not replacing Certify/Wallet/Verify — it orchestrates and visualizes them.
- Not required to support every credential format or every external ecosystem (only mandatory: 2 formats end-to-end).

### 4. Personas
| Persona | Need |
|---|---|
| MOSIP/Inji core developer | Wants to see where their modules break against real OpenID4VCI/VP flows |
| External integrator | Wants to understand Inji's standards compliance before building on it |
| Hackathon judge / reviewer | Wants a quick, visual demo of the full credential lifecycle |
| QA / interoperability tester | Wants to run repeatable tests across module/version/format combinations |

### 5. User Stories
- As a developer, I can pick an Issuer, Wallet, and Verifier from a matrix and run a live test.
- As a developer, I can watch each protocol step happen live (offer, token, credential, presentation, verification).
- As a developer, I can inspect the raw JSON payload of any step.
- As a developer, I can see a clear pass/fail result with reason if failed.
- As a developer, I can compare results across credential formats (W3C VC vs SD-JWT VC).
- As a tester, I can deliberately tamper a credential and confirm the verifier rejects it correctly.
- As a reviewer, I can view a historical dashboard of past runs.

### 6. Scope (Mandatory / Good-to-have / Bonus)

**Mandatory**
1. Core Inji Stack running end-to-end (Certify, Wallet/Web, Verify).
2. 3-column Issuer/Wallet/Verifier selector UI.
3. Live "Issue a Credential" flow (OpenID4VCI).
4. Live "Present & Verify" flow (OpenID4VP) with Valid/Invalid/Valid-but-Expired result.
5. Protocol inspector panel showing raw payloads per step.
6. Support ≥2 credential formats end-to-end, clearly labeled.
7. Pass/fail interoperability report per test run.

**Good-to-have**
- Non-Inji mock issuer/verifier for cross-ecosystem testing.
- mDoc/mDL as a third format.
- Animated Mermaid sequence diagram.
- Tamper/replay mode.
- Historical dashboard with filters.
- Same-device OpenID4VP flow.

**Bonus**
- CI-style nightly interoperability suite.
- Filed GitHub issues for discovered gaps.
- Telemetry/observability.
- One-command Docker Compose packaging.

### 7. Success Metrics
- At least one full end-to-end cycle (issue → hold → present → verify) demoable live.
- ≥2 credential formats verified working.
- Interoperability report generated automatically for every run.
- Demo video (3–5 min) recorded showing the above.

### 8. Constraints & Assumptions
- Complexity level: High (multi-module orchestration, multiple standards).
- Assume access to either local Docker Compose stack or MOSIP Collab sandbox.
- Mobile wallet testing requires QR/deep-link and possibly ngrok for local-to-mobile connectivity.

### 9. Open Questions
- Which non-Inji mock (Sphereon / Walt.id / DIF) will be used for cross-ecosystem testing, if attempted?
- Will report storage be file-based (JSON/Markdown) or a lightweight DB (SQLite/Postgres)?
- Is same-device OpenID4VP (Digital Credentials API) in scope given browser support constraints?
