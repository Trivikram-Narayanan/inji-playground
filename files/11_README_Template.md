# Inji Interoperability Playground

A visual sandbox for issuing, holding, presenting, and verifying Verifiable Credentials across Inji Certify, Inji Wallet, and Inji Verify — and cross-testing against external OpenID4VCI/OpenID4VP-compliant implementations.

## Features
- Configure any combination of Issuer / Wallet / Verifier.
- Live issuance flow (OpenID4VCI) and presentation/verification flow (OpenID4VP).
- Protocol inspector showing raw payloads at every step.
- Support for multiple credential formats (W3C VC, SD-JWT VC, mDoc).
- Automatic pass/fail interoperability reports.
- (Optional) Tamper mode, cross-ecosystem mocks, historical dashboard.

## Architecture
See [`docs/03_Architecture.md`](docs/03_Architecture.md) for the full system diagram and data flow.

```
Frontend (React) → Playground BFF (Node/Express) → Inji Certify / Mimoto+Wallet / Inji Verify
```

## Prerequisites
- Docker + Docker Compose
- Node.js (LTS)
- ngrok (for mobile wallet testing)

## Setup
See [`docs/08_Environment_Setup_Guide.md`](docs/08_Environment_Setup_Guide.md) for full instructions. Quick start:

```bash
git clone <this-repo>
cd infra && docker compose up -d
cd ../backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
```

Open `http://localhost:<frontend-port>` in your browser.

## Running a Test
1. Select an Issuer, Wallet, and Verifier.
2. Choose a credential format.
3. Click "Run Test."
4. Watch the live flow timeline and inspect protocol payloads.
5. View the generated interoperability report at the end.

## Project Structure
```
/frontend   → Playground UI (React + TypeScript + Tailwind)
/backend    → Playground BFF (Node.js/Express)
/infra      → Docker Compose configs
/docs       → Full specification & design documents
```

## Documentation Index
| Doc | Purpose |
|---|---|
| `01_PRD.md` | Product requirements & scope |
| `02_Glossary.md` | Terminology reference |
| `03_Architecture.md` | System architecture |
| `04_Sequence_Diagrams.md` | Protocol flow diagrams |
| `05_API_Specification.md` | BFF API contract |
| `06_Data_Model.md` | Schema & entities |
| `07_State_Machine.md` | Test-run lifecycle states |
| `08_Environment_Setup_Guide.md` | Local/sandbox setup |
| `09_Test_Plan.md` | Test matrix & cases |
| `10_Report_Templates.md` | Report & gap write-up formats |
| `Inji_Interoperability_Playground_Spec.md` | Phased build plan |

## Deliverables
- Working Playground (local or deployed).
- Interoperability report/matrix (see `docs/10_Report_Templates.md`).
- Demo video (3–5 min).
- Filed GitHub issues for any discovered interoperability gaps.

## License
<add license>

## Acknowledgements
Built for the MOSIP Decode hackathon, on top of the Inji Stack (Certify, Wallet, Verify) and OpenID4VCI/OpenID4VP standards.
