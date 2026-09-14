# 12. Enhancements, Extensions & Bonus Features

This document provides a comprehensive technical reference for the major enhancements built into the **Inji Interoperability Playground**, exceeding the baseline requirements of the MOSIP Decrypt problem statement.

---

## 1. Interactive Mermaid.js Sequence Diagram

### 1.1 Architecture & Implementation
* **Component**: `frontend/src/components/SequenceDiagram.tsx`
* **Library**: `mermaid` (SVG renderer)
* **Design Philosophy**: While a list timeline shows status, an architectural sequence diagram shows **protocol semantics**. The diagram visualizes the three core actors in Verifiable Credential ecosystems:
  1. **Issuer (`Inji Certify` / Mock OpenID4VCI Issuer)**
  2. **Wallet (`Inji Mobile` / `Inji Web` / Mock Holder)**
  3. **Verifier (`Inji Verify` / Relying Party)**

### 1.2 Dynamic Event Synchronization
The sequence diagram dynamically re-renders and highlights each protocol interaction based on the live Server-Sent Events (`SSE`) feed emitted by the Playground BFF:
1. `I->>W: 1. Credential Offer (OpenID4VCI Draft 13)`
2. `W->>I: 2. POST /token (Pre-Authorized Code Grant)`
3. `I->>W: 3. Issued Credential (W3C VC / SD-JWT / mDoc)`
4. `V->>W: 4. Auth Request (OpenID4VP Draft 21-23 Presentation Definition)`
5. `W->>V: 5. POST /presentation (vp_token submission)`
6. `V->>W: 6. Verification Result (Valid / Invalid / Valid-but-Expired)`

### 1.3 Interactive Step Payloads
Each exchange line in the diagram has a corresponding interactive step selector button. Clicking any step in the sequence diagram directly focuses that exact message payload in the **Protocol Inspector** panel with full JSON syntax highlighting.

---

## 2. Same-Device Flow Simulation (Deep-Link & Digital Credentials API)

### 2.1 Overview
In addition to the traditional cross-device flow (desktop browser rendering a QR code for a mobile device camera), real-world mobile browsers need **Same-Device flows** where the browser hands off credentials directly to a wallet installed on the same device.

### 2.2 Features Implemented
* **Mode Toggle**: In `LiveFlowTimeline.tsx`, users can toggle between:
  - **Cross-Device (QR Code)**: standard high-contrast SVG QR code.
  - **Same-Device (Deep-Link / Web API)**: direct mobile handoff controls.
* **Standard URI Schemes**:
  - `openid-credential-offer://?credential_offer=...`
  - `inji://credential-offer?data=...`
* **Actions**:
  - **Copy Link**: One-click clipboard copy with visual feedback toast.
  - **Open in Inji App**: Simulates native app scheme interception and wallet trigger.
  - **Simulate Web API**: Simulates the W3C Digital Credentials API (`navigator.identity.get()`).

---

## 3. One-Command Full-Stack Docker Packaging

### 3.1 Containerization
To ensure the entire application can be spun up in seconds without configuring Node.js, native build tools, or port dependencies:

* **Backend (`backend/Dockerfile`)**:
  - Multi-stage build (`node:20-alpine`).
  - Compiles TypeScript via `tsc`.
  - Injects SQLite schema and starts production server on port `3000`.
* **Frontend (`frontend/Dockerfile` & `frontend/nginx.conf`)**:
  - Multi-stage build (`node:20-alpine` → `nginx:alpine`).
  - Builds optimized Vite static production assets.
  - Nginx reverse-proxies `/api/` traffic directly to the backend container while serving static assets on port `80`/`5173`.
* **Root Orchestrator (`docker-compose.yml`)**:
  - Launches both services together:
    ```bash
    docker compose up --build
    ```
  - Frontend accessible at `http://localhost:5173`.
  - Backend API accessible at `http://localhost:3000`.

---

## 4. Automated CI Interoperability Matrix Runner

### 4.1 Automated Matrix Runner Script
* **Script**: `.github/scripts/run-matrix.mjs`
* **Scope**: Automatically runs all 13 core format × tamper test scenarios against the running playground BFF:
  - Cases 1–4: W3C VC JSON-LD (normal, bad signature, claim corruption, expired).
  - Cases 5–8: SD-JWT VC (normal, bad signature, claim corruption, expired).
  - Cases 9–12: mDoc / mDL (normal, bad signature, claim corruption, expired).
  - Case 13: Cross-ecosystem gap (`external-mock` issuer → `DID_METHOD_GAP`).
* **Output**: Generates `matrix-summary.md` containing formatted markdown comparison tables and verification status.

### 4.2 GitHub Actions Workflow
* **Workflow**: `.github/workflows/interop-matrix.yml`
* **Triggers**:
  - `push` to main/master branches.
  - `pull_request`.
  - `schedule`: Nightly cron at `02:00 UTC`.
  - `workflow_dispatch`: Manual on-demand triggers.
* **Job Summary Publication**:
  - Appends the matrix output directly to `$GITHUB_STEP_SUMMARY` so repository maintainers can see the interoperability matrix rendered on GitHub without checking logs.
  - Uploads `matrix-summary.md` as a build artifact for compliance records.

---

## 5. Verification Matrix Summary

| Test Case | Format | Scenario | Expected Outcome | Verified Result |
|---|---|---|---|:---:|
| **1** | W3C VC JSON-LD | Happy Path | `valid` | **PASS** |
| **2** | W3C VC JSON-LD | Tamper: Bad Signature | `invalid` (`SIGNATURE_INVALID`) | **PASS** |
| **3** | W3C VC JSON-LD | Tamper: Claim Corruption | `invalid` (`SIGNATURE_INVALID`) | **PASS** |
| **4** | W3C VC JSON-LD | Tamper: Expired Credential | `valid-but-expired` (`CREDENTIAL_EXPIRED`) | **PASS** |
| **5** | SD-JWT VC | Happy Path | `valid` | **PASS** |
| **6** | SD-JWT VC | Tamper: Bad Signature | `invalid` (`SIGNATURE_INVALID`) | **PASS** |
| **7** | SD-JWT VC | Tamper: Claim Corruption | `invalid` (`CLAIM_MISMATCH`) | **PASS** |
| **8** | SD-JWT VC | Tamper: Expired Credential | `valid-but-expired` (`CREDENTIAL_EXPIRED`) | **PASS** |
| **9** | mDoc / mDL | Happy Path | `valid` | **PASS** |
| **10** | mDoc / mDL | Tamper: Bad Signature | `invalid` (`SIGNATURE_INVALID`) | **PASS** |
| **11** | mDoc / mDL | Tamper: Claim Corruption | `invalid` (`CLAIM_MISMATCH`) | **PASS** |
| **12** | mDoc / mDL | Tamper: Expired Credential | `valid-but-expired` (`CREDENTIAL_EXPIRED`) | **PASS** |
| **13** | W3C VC (`external-mock`) | Cross-Ecosystem Gap | `invalid` (`DID_METHOD_GAP`) | **PASS** |
