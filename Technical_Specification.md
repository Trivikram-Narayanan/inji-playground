# Technical Specification: Inji Interoperability Playground

## 1. Overview
The **Inji Interoperability Playground** is a full-stack web application designed to orchestrate, simulate, and inspect OpenID4VCI and OpenID4VP protocol flows. It is built as a mock environment allowing developers to test interoperability between various Issuers, Wallets, and Verifiers without needing live external infrastructure.

## 2. Architecture
The system follows a classic Backend-for-Frontend (BFF) architecture.

### 2.1 Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Routing**: `react-router-dom`
- **Role**: Provides the user interface for configuration, real-time protocol visualization, JSON inspection, and historical reporting.

### 2.2 Backend (BFF)
- **Framework**: Node.js, Express, TypeScript
- **Database**: SQLite (via `sqlite` and `sqlite3` packages)
- **Role**: Manages the persistence of test runs, simulates protocol exchanges (acting as a mock orchestrator), and aggregates data for reporting.

---

## 3. Data Model

The application uses a local SQLite database with three primary tables:

### 3.1 `test_runs`
Tracks the lifecycle and configuration of a specific interoperability test.
- `id` (TEXT, Primary Key): UUID of the test run.
- `issuer` (TEXT): Identifier of the selected issuer (e.g., `inji-certify`).
- `wallet` (TEXT): Identifier of the selected wallet (e.g., `inji-wallet-mobile`).
- `verifier` (TEXT): Identifier of the selected verifier (e.g., `inji-verify`).
- `format` (TEXT): Requested VC format (`w3c-vc-jsonld`, `sd-jwt-vc`, `mdoc`).
- `tamper_mode` (INTEGER): Boolean indicating if negative testing is enabled.
- `tamper_type` (TEXT): The type of tampering applied (`claim-corruption`, `bad-signature`, `expired`).
- `status` (TEXT): Current state of the flow (`CREATED`, `OFFER_CREATED`, `COMPLETED`).
- `result` (TEXT): Final outcome (`valid`, `invalid`, `valid-but-expired`).
- `created_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)

### 3.2 `protocol_events`
Logs individual steps of the OpenID4VCI and OpenID4VP protocols.
- `id` (TEXT, Primary Key): UUID of the event.
- `flow_id` (TEXT): Foreign key referencing `test_runs.id`.
- `step` (TEXT): Identifier of the protocol step (e.g., `credential_offer`, `presentation`).
- `actor` (TEXT): Entity performing the action (`issuer`, `wallet`, `verifier`).
- `payload` (TEXT): JSON stringified representation of the raw protocol payload.
- `status` (TEXT): Execution status of the step (`success`, `error`).
- `timestamp` (TIMESTAMP)

### 3.3 `reports`
Aggregated summary generated upon flow completion for compliance and dashboarding.
- `id` (INTEGER, Primary Key, Auto-increment)
- `flow_id` (TEXT): Foreign key referencing `test_runs.id`.
- `issuer`, `wallet`, `verifier`, `format` (TEXT): Copied from `test_runs`.
- `proof_type` (TEXT): Cryptographic proof used (e.g., `ES256`).
- `outcome` (TEXT): Overall test result (`pass`, `fail`).
- `duration_ms` (INTEGER): Time taken from first event to completion.
- `error_code` (TEXT, Nullable): Specific error code if failed (e.g., `SIGNATURE_INVALID`).
- `error_detail` (TEXT, Nullable): Human-readable error description.
- `created_at` (TIMESTAMP)

---

## 4. API Specification

All endpoints are prefixed with `/api`.

### 4.1 Flow Management (`/flows`)

- **`POST /flows`**
  - **Description**: Initiates a new test run.
  - **Body**: `{ issuer, wallet, verifier, format, tamperMode, tamperType }`
  - **Response**: `{ flowId, status, offer }`
  - **Behavior**: Creates a `test_runs` record and a `protocol_events` record for the `credential_offer`.

- **`GET /flows/:id`**
  - **Description**: Retrieves the current status of a specific test run.
  - **Response**: `{ id, status, result, ... }`

- **`GET /flows/:id/events`**
  - **Description**: Retrieves all protocol events associated with a test run, ordered chronologically.
  - **Response**: `{ events: [{ step, actor, payload, status, timestamp }] }`

- **`POST /flows/:id/advance`**
  - **Description**: Simulates the execution of the remaining protocol steps (Hackathon Mode).
  - **Behavior**: 
    1. Inserts mock payloads for `token_exchange`, `credential_issued`, `authorization_request`, and `presentation`.
    2. Evaluates `tamperMode` and cross-ecosystem compatibility logic.
    3. Inserts a final `verification_result` event.
    4. Updates `test_runs` to `COMPLETED`.
    5. Generates a `reports` record.
  - **Response**: `{ status: 'COMPLETED', result: 'valid' | 'invalid' | 'valid-but-expired' }`

- **`GET /flows/:id/report`**
  - **Description**: Retrieves the final interoperability report for a completed flow.
  - **Response**: `InteropReport` object.

### 4.2 Reports Management (`/reports`)

- **`GET /reports`**
  - **Description**: Retrieves all historical interoperability reports.
  - **Response**: `[InteropReport]`

- **`GET /reports/stats`**
  - **Description**: Retrieves aggregated statistics for the historical dashboard.
  - **Response**: `{ totalTests, passed, failed, passRate, mostCommonError }`

---

## 5. Frontend Component Hierarchy

- **`Layout.tsx`**: Base wrapper handling `react-router-dom` navigation and the global header.
  - **`MainFlow.tsx`**: The primary "New Test" interface.
    - **`Selector.tsx`**: Configuration panel for establishing test parameters (Issuer, Wallet, Verifier, Format, Tamper).
    - **`LiveFlowTimeline.tsx`**: Dynamic visualization of the `protocol_events` sequence. Displays QR codes and completion banners.
    - **`ProtocolInspector.tsx`**: Syntax-highlighted code block rendering the `payload` of a selected `protocol_event`.
    - **`ReportView.tsx`**: Modal popup displaying the finalized report and offering JSON export.
  - **`Dashboard.tsx`**: The historical view.
    - Renders high-level statistic cards.
    - Renders a tabular list of all past `reports`.

---

## 6. Core Logic & Advanced Features

### 6.1 Tamper Mode (Negative Testing)
Implemented in the `advanceFlow` method of the Orchestrator. When `tamperMode` is enabled:
- The `presentation` step payload is intentionally corrupted (e.g., `mock_vp_token_TAMPERED_bad-signature`).
- The `verification_result` evaluates the tamper type and produces a simulated failure.
- The corresponding `error_code` (`SIGNATURE_INVALID`, `CLAIM_MISMATCH`, `CREDENTIAL_EXPIRED`) is written to the final report.

### 6.2 Cross-Ecosystem Mocks
Designed to simulate real-world incompatibilities.
- The Orchestrator intercepts specific configurations (e.g., `external-mock` Issuer + `inji-wallet-mobile` + `w3c-vc-jsonld`).
- In these explicitly defined gaps, the flow is forced into an `invalid` state.
- An error code of `DID_METHOD_GAP` is attached to the report to demonstrate how the platform identifies cross-ecosystem friction.
