# System Architecture Document

## 1. High-Level Component Diagram (textual)

```
┌─────────────────────────────┐
│      Playground Frontend    │
│  React + TypeScript + Tailwind │
│  - Selector UI               │
│  - Live Flow Timeline        │
│  - Protocol Inspector        │
│  - Report / Dashboard        │
└──────────────┬───────────────┘
               │ REST / WebSocket
               ▼
┌─────────────────────────────┐
│     Playground BFF           │
│  Node.js/Express             │
│  - Orchestrates flows        │
│  - Normalizes responses      │
│  - Persists events/reports   │
└───┬───────────┬───────────┬──┘
    │           │           │
    ▼           ▼           ▼
┌────────┐ ┌──────────┐ ┌─────────┐
│ Inji   │ │ Mimoto + │ │  Inji   │
│Certify │ │  Wallet  │ │ Verify  │
│(Issuer)│ │ (Holder) │ │(Verifier)│
└────────┘ └──────────┘ └─────────┘
    │                        │
    ▼                        ▼
(optional)              (optional)
External Mock           External Mock
Issuer (OpenID4VCI)     Verifier (OpenID4VP)
```

## 2. Components

### 2.1 Frontend (Playground UI)
- **Stack:** React + TypeScript (Vite or Next.js), Tailwind CSS.
- **Responsibilities:** component selector, live flow visualization, protocol inspector, report/dashboard views.
- **Reuse:** `@mosip/react-inji-verify-sdk` components (QRCodeVerification, OpenID4VPVerification) where possible.

### 2.2 Playground BFF (Backend Orchestrator)
- **Stack:** Node.js/Express (or Spring Boot as alternative).
- **Responsibilities:**
  - Accept a `FlowConfig` (issuer/wallet/verifier/format selection) and start a test run.
  - Call Inji Certify to create credential offers.
  - Relay data to/from the selected wallet.
  - Call Inji Verify to initiate/validate presentations.
  - Capture every request/response as a `ProtocolEvent`.
  - Persist `TestRun` records and generate `Report` objects.
  - Expose REST endpoints + WebSocket/polling channel for live updates.

### 2.3 Inji Certify (Issuer)
- Spring Boot, plugin-based. Issues credentials via OpenID4VCI (draft 13).
- Run via Docker Compose; mock or MOSIP ID/eSignet-backed plugins.

### 2.4 Inji Wallet / Inji Web (Holder)
- Mobile: React Native + Mimoto BFF (Java) + Tuvali (BLE) + PixelPass (QR).
- Web: React + Mimoto BFF, for browser-based holding.

### 2.5 Inji Verify (Verifier)
- Spring Boot verify-service + React verify-ui, or standalone `react-inji-verify-sdk`.
- Validates presentations via OpenID4VP (draft 21–23).

### 2.6 External Mocks (Good-to-have)
- A DIF/Sphereon/Walt.id-style mock issuer or verifier to prove cross-ecosystem interoperability.

## 3. Data Flow Summary

1. User configures Issuer/Wallet/Verifier/Format in Frontend → sent to BFF as `FlowConfig`.
2. BFF creates a `TestRun`, calls Issuer to create a credential offer.
3. BFF relays offer to Wallet (QR/deep-link for mobile, direct call for Web).
4. Wallet exchanges token and receives credential from Issuer.
5. User/Wallet triggers presentation to Verifier (QR cross-device or same-device deep-link).
6. BFF relays `vp_token`/`presentation_definition` exchange to Verifier.
7. Verifier returns result → BFF logs it as final `ProtocolEvent` and closes the `TestRun`.
8. BFF generates a `Report` from all captured events.
9. Frontend polls/subscribes for live events and renders inspector + final report.

## 4. Deployment Topology
- **Local dev:** Docker Compose brings up Certify, Mimoto/Wallet/Web, Verify, Postgres/Redis (as required), plus Frontend + BFF running via `npm run dev`.
- **Mobile testing:** ngrok or reverse-proxy tunnels local BFF/Certify/Verify endpoints to a public URL reachable by the mobile wallet.
- **Sandbox alternative:** Point BFF configuration at the MOSIP Collab sandbox endpoints instead of local containers.

## 5. Key Design Decisions
- BFF is the single source of truth for protocol events — Frontend never talks to Certify/Verify directly, ensuring consistent capture for the inspector/report.
- Protocol events are stored with a common schema regardless of which module/format produced them, enabling format-agnostic reporting.
- External mocks are pluggable via the same `FlowConfig` interface as Inji modules — no special-casing in the Frontend.
