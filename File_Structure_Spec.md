# File Structure Specification
## Inji Interoperability Playground

This document outlines the file and directory structure of the Inji Interoperability Playground. The project is organized as a monorepo containing a React frontend and a Node.js/Express backend.

```text
Mosip/
│
├── docker-compose.yml              # Defines the multi-container Docker setup for the playground (BFF + Frontend)
├── Inji_Interoperability_Playground_Spec.md # Original hackathon specification document
├── README.md                       # Main project documentation, setup instructions, and feature overview
├── File_Structure_Spec.md          # This document
│
├── backend/                        # Backend-for-Frontend (BFF) Node.js Application
│   ├── package.json                # Backend dependencies and scripts (Express, SQLite, etc.)
│   ├── tsconfig.json               # TypeScript configuration for the backend
│   └── src/                        # Source code for the BFF
│       ├── index.ts                # Application entry point; initializes Express server and routes
│       ├── db/
│       │   ├── index.ts            # SQLite database connection and initialization logic
│       │   └── schema.sql          # SQL table definitions (`test_runs`, `protocol_events`, `reports`)
│       ├── routes/
│       │   ├── flows.ts            # API routes for initiating flows and simulating advancement (`/api/flows`)
│       │   └── reports.ts          # API routes for fetching reports and dashboard stats (`/api/reports`)
│       └── services/
│           └── orchestrator.ts     # Core business logic: manages test runs, protocol events, tamper logic, and report generation
│
└── frontend/                       # React + Vite Frontend Application
    ├── package.json                # Frontend dependencies (React, Tailwind, lucide-react, react-router-dom, etc.)
    ├── tsconfig.json               # TypeScript configuration for the frontend
    ├── tailwind.config.js          # TailwindCSS styling configuration
    ├── index.html                  # Main HTML entry point
    └── src/                        # Source code for the UI
        ├── main.tsx                # React application bootstrapper
        ├── index.css               # Global CSS and Tailwind directives
        ├── App.tsx                 # Defines application routing using `react-router-dom`
        └── components/
            ├── Layout.tsx          # Global layout wrapper containing the top navigation bar
            ├── MainFlow.tsx        # Container for the "New Test" view (combines Selector, Timeline, Inspector)
            ├── Dashboard.tsx       # Historical reports dashboard and statistics view
            ├── Selector.tsx        # Configuration UI (Issuer, Wallet, Verifier, Format, Tamper Mode)
            ├── LiveFlowTimeline.tsx# Visual protocol timeline showing the progression of OpenID4VCI/VP steps
            ├── ProtocolInspector.tsx# Right-hand panel for viewing syntax-highlighted raw JSON payloads
            └── ReportView.tsx      # Modal component displaying the detailed interoperability report and export functionality
```

### Key Architectural Flows
- **Configuration**: User interacts with `frontend/src/components/Selector.tsx`. The config is sent to `backend/src/routes/flows.ts` which uses `orchestrator.ts` to create a `test_runs` record in the SQLite DB.
- **Execution**: As the flow advances, `orchestrator.ts` records `protocol_events`. These are fetched and displayed visually by `LiveFlowTimeline.tsx` and textually by `ProtocolInspector.tsx`.
- **Reporting**: Once the flow completes, `orchestrator.ts` generates a `reports` record. The frontend fetches this via `backend/src/routes/reports.ts` and renders it via `ReportView.tsx` (single run) or `Dashboard.tsx` (historical aggregate).
