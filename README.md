# CargoTrace

> **Production-Oriented Cargo Damage Investigation & Evidence Management Platform**

CargoTrace is a web application designed for logistics companies, shipment operators, warehouse teams, cargo inspectors, and investigation reviewers. It enables teams to document cargo damage, organize shipment evidence, reconstruct custody timelines, identify missing information, and prepare evidence-backed investigation reports.

---

## Architecture Overview

The codebase is strictly structured into two independent application directories:

```
CargoTrace/
├── client/                     # React 19 + Vite frontend application
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Authentication state, session restoration & tenant context
│   │   ├── features/
│   │   │   ├── auth/           # Login & Organization Registration views
│   │   │   ├── organization/   # Organization workspace, members & RBAC
│   │   │   ├── shipments/      # Shipment ledger, creation form, filter controls
│   │   │   ├── custody/        # Custody timeline, custodian transition forms
│   │   │   ├── inspections/    # Condition inspection lists, packaging/seal checks
│   │   │   ├── incidents/      # Damage incident reports, severity badges, resolution
│   │   │   ├── evidence/       # Evidence gallery, SHA-256 integrity, upload modals
│   │   │   └── investigation/  # Unified Timeline feed, Anomalies & Gap diagnostic review, AI Case Analysis
│   │   ├── components/
│   │   │   └── feedback/       # Live system telemetry modal
│   │   ├── lib/apiClient.js    # Centralized Fetch API client with timeout & error normalization
│   │   ├── styles/             # Tailwind CSS styling
│   │   ├── App.jsx             # Top-level state-driven router
│   │   └── main.jsx            # Frontend entry point
│   ├── .env.example            # Frontend environment documentation
│   ├── package.json            # Frontend dependencies & scripts
│   ├── vite.config.js          # Vite build & proxy configuration
│   └── README.md
│
├── server/                     # Node.js + Express backend application
│   ├── src/
│   │   ├── config/             # Environment, MongoDB, Firebase, and AI configs
│   │   ├── middleware/         # Authenticate, authorize, requestId, error handler, validate, rateLimit
│   │   ├── modules/
│   │   │   ├── auth/           # Auth routes, controller, service, validation, session model, RBAC
│   │   │   ├── organizations/  # Organization model, routes, controller, service
│   │   │   ├── users/          # User model with bcrypt password hashing
│   │   │   ├── memberships/    # Membership model with compound user-org uniqueness
│   │   │   ├── audit/          # Append-only security audit log model
│   │   │   ├── shipments/      # Shipment model (`CT-YYYYMM-XXXX`), service, controller, routes
│   │   │   ├── custody/        # CustodyEvent model, service, controller, routes
│   │   │   ├── inspections/    # Inspection model, service, controller, routes
│   │   │   ├── incidents/      # DamageIncident model (`INC-YYYYMM-XXXX`), service, controller, routes
│   │   │   ├── evidence/       # Evidence model (`EVD-YYYYMM-XXXX`), multer, SHA-256 checksums, service, routes
│   │   │   └── investigation/  # InvestigationReview & AIInvestigationReport models, rule engine, citation validator, routes
│   │   ├── utils/              # Structured logger with secret redaction
│   │   ├── app.js              # Express app with CORS & /api/v1 routes
│   │   └── server.js           # Standalone backend server entry point
│   ├── .env.example            # Backend environment documentation
│   ├── package.json            # Backend dependencies & scripts
│   └── README.md
│
├── .gitignore
├── metadata.json
└── README.md
```

---

## API Endpoints (Phase 6.1 Summary)

### Investigation Workspace (`/api/v1/shipments/:shipmentId/investigation`)
- `GET /timeline`: Returns a normalized, chronologically sorted timeline merging shipment registration, custody handovers, inspections, damage incidents, status changes, and evidence uploads.
- `GET /anomalies`: Evaluates 9 deterministic rule checks (`TEMP_01`, `CUST_01`, `CUST_02`, `INSP_01`, `INC_01`, `CUST_03`, `INSP_02`, `CUST_04`, `INC_02`) returning severity badges and source record links.
- `GET /gaps`: Analyzes evidence completeness (`GAP_01` missing origin inspection, `GAP_02` missing destination receipt, `GAP_03` unlinked incident, `GAP_04` no custody log).
- `POST /review`: Persists human investigator oversight decision (`ACKNOWLEDGED`, `ADDRESSED`, `NOT_APPLICABLE`, `OPEN`) and review notes in `InvestigationReview`.
- `POST /ai-reports`: Synthesizes evidence-grounded AI case report using Gemini (`gemini-3.5-flash-lite`), validates source citations against database records, and saves versioned report in `AIInvestigationReport`.
- `GET /ai-reports`: Lists version history for AI investigation reports for the active shipment.
- `GET /ai-reports/:reportId`: Fetches a specific versioned AI investigation report by ID.

---

## Configuration

### Server Environment Variables (`server/.env`)

```ini
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cargotrace?retryWrites=true&w=majority
SESSION_SECRET=cargotrace-development-session-secret-change-in-production

# Gemini AI Integration Configuration
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
AI_PROVIDER=google
```

---

## Current Status: Phase 6.1 Complete

- [x] Model default configured to `gemini-3.5-flash-lite` and configurable via `GEMINI_MODEL`.
- [x] Server-side source catalogue validation checking every AI citation against real database records.
- [x] Non-probabilistic qualitative scaling and explicit non-liability legal disclaimers.
- [x] Concurrency-safe atomic report versioning in MongoDB (`AIInvestigationReport`).
- [x] Multi-tenant organization scoping and RBAC enforcement across all endpoints.
- [x] 26/26 backend unit tests passing in Node test runner.
