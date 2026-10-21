# CargoTrace Backend API Server (`server/`)

The Node.js Express backend application for CargoTrace. It handles authentication, authorization, organization tenancy, shipment and custody management, evidence storage metadata, AI orchestration, and audit logging.

## Prerequisites

- Node.js 20+ (ES modules)
- MongoDB instance (MongoDB Atlas or local `mongod`)
- Firebase project with Firebase Storage (for evidence storage)
- Google Gemini API key (for investigation AI analysis)

## Installation

```bash
cd server
npm install
```

## Configuration

Copy the example environment file and configure variables:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | API server listen port | `5000` |
| `NODE_ENV` | Environment mode (`development`, `production`) | `development` |
| `CLIENT_ORIGIN` | Allowed client origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection URI | Required for persistence |
| `SESSION_SECRET` | Session signing secret key | Min 32 chars |
| `FIREBASE_PROJECT_ID` | Firebase project ID | For evidence storage |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | For evidence storage |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | For evidence storage |
| `AI_PROVIDER` | AI provider name | `google` |
| `AI_API_KEY` | Google Gemini API key | Optional during Phase 1 & 2 |
| `AI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `LOG_LEVEL` | Log severity level (`debug`, `info`, `warn`, `error`) | `info` |

## Running the Server

Start in development mode with automatic reload on changes:

```bash
npm run dev
```

Start in production mode:

```bash
npm start
```

Run test suite:

```bash
npm test
```

## API Endpoints (Phase 2)

### Health & Telemetry
- `GET /api/v1/health`: Subsystem telemetry (database, storage, AI engine).

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Creates User, Organization, and initial Admin membership atomically. Returns session cookie + JSON.
- `POST /api/v1/auth/login`: Authenticates with bcrypt hash verification, establishes MongoDB session, and sets secure HTTP-only cookie.
- `POST /api/v1/auth/logout`: Invalidates session in MongoDB and clears cookie.
- `GET /api/v1/auth/me`: Restores session and returns user profile, current organization, role, and permissions.

### Organizations & Memberships (`/api/v1/organizations`)
- `GET /api/v1/organizations/current`: Retrieves current organization profile and member count.
- `GET /api/v1/organizations/current/members`: Lists members within the current tenant boundary.
- `POST /api/v1/organizations/current/members`: Invites/adds a member with a specific role (`admin`, `investigator`, `reviewer`, `viewer`). Restricted to `admin` role.

## Role-Based Access Control (RBAC) Matrix

- **`admin`**: Full organization management, member invitations, and all operational authorities.
- **`investigator`**: Create and update shipments, custody events, inspections, and evidence (Phase 3+).
- **`reviewer`**: Review findings, examine evidence references, and approve/reject investigation reports (Phase 8).
- **`viewer`**: Read-only access to authorized records.
