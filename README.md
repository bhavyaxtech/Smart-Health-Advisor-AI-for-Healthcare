# Smart Health Advisor AI

Smart Health Advisor AI is a full-stack health guidance application with a React frontend, a FastAPI backend, MongoDB persistence, Google-only authentication, lifetime analysis credits, and PubMed-backed literature summaries.

## High-Level Architecture

### Stack

- Frontend: React 19, Create React App, plain CSS
- Backend: FastAPI, Pydantic, Python 3.11
- Persistence: MongoDB via Motor
- Authentication: Google Identity Services on the client, Google token verification on the server
- External medical data: PubMed E-utilities
- Production packaging: Nginx serving the SPA and proxying `/api` to Uvicorn

### Textual System Diagram

```text
Browser
  -> React SPA (frontend/src/App.js)
      -> frontend/src/services/api.js
          -> FastAPI app (backend/server.py)
              -> Auth service (backend/services/auth.py)
                  -> Google tokeninfo endpoint
              -> Analysis service (backend/services/analysis.py)
              -> PubMed integration (backend/external_integrations/pubmed.py)
              -> Mongo repositories (backend/repositories.py)
                  -> MongoDB

Production container
  -> Nginx
      -> static frontend build
      -> reverse proxy /api -> Uvicorn backend.server:app
```

### Module Responsibilities

- [frontend/src/App.js](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/frontend/src/App.js): single-screen product UI for auth, symptom analysis, history, dashboard, chat, voice, and research.
- [frontend/src/services/api.js](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/frontend/src/services/api.js): API client, auth header injection, and error normalization.
- [frontend/src/utils/session.js](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/frontend/src/utils/session.js): localStorage-backed auth session storage.
- [backend/server.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/server.py): API contract, request validation, route orchestration, and app lifecycle.
- [backend/services/auth.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/services/auth.py): Google token verification and JWT access token handling.
- [backend/services/analysis.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/services/analysis.py): deterministic health guidance, diet suggestions, risk assessment, chat, and voice helpers.
- [backend/external_integrations/pubmed.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/external_integrations/pubmed.py): PubMed query construction, fetch, summary normalization, and digest formatting.
- [backend/repositories.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/repositories.py): user and symptom analysis persistence.
- [backend/database.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/database.py): Mongo connection lifecycle and index creation.

### Execution Flow

1. The user opens the React SPA and signs in with Google.
2. The frontend sends the Google ID token to `POST /api/auth/google`.
3. The backend verifies the token with Google, upserts the Mongo user, and returns a signed access token plus user data.
4. Authenticated frontend requests include the bearer token.
5. On `POST /api/analyze-symptom`, the backend:
   - validates the JWT
   - loads the user and enforces the remaining credit count
   - fetches PubMed research summaries
   - builds a structured analysis response
   - attempts one durable write workflow that stores the analysis and charges one credit
   - restores the credit automatically if persistence fails after charging
6. History, dashboard, pattern analysis, chat, voice, and research routes reuse stored user data and recent analyses.

## Current State Analysis

### Fully Implemented

- Google-authenticated API flow
- Credit tracking and credit consumption on symptom analysis
- Durable credit rollback if analysis persistence fails
- Symptom analysis response generation
- PubMed search integration with graceful fallback messaging
- History, dashboard, pattern analysis, chat, voice, and research endpoints
- Frontend screens for all major authenticated workflows
- Degraded backend startup and health reporting when MongoDB is unavailable

### Partially Implemented

- Automated tests: the repository had test files, but they only exercised outdated unauthenticated scripts and did not validate the current product contract.
- Deployment assets: Nginx and containerization existed, but the backend package path and build path were inconsistent.
- Documentation: almost entirely missing or stale.

### Production Hardening Delivered

- Durable symptom-analysis storage now protects users from losing a credit when persistence fails.
- MongoDB is now a degradable dependency at startup, and `GET /api/health` reports database availability explicitly.
- PubMed configuration is now centralized and graceful fallback messaging is preserved when PubMed is unreachable.
- Frontend session and service-state handling now distinguishes expired auth, degraded backend responses, and hard network failures.
- Environment examples and auth config now match the Google ID token flow actually used by the app.

### Gap Severity

- Critical
  - Valid frontend HTML bootstrap document
  - Valid production backend package layout and startup command
- Important
  - Accurate setup documentation
  - Meaningful pytest coverage for the authenticated analysis workflow
  - Environment sample values aligned with the real app
- Optional
  - Splitting frontend into smaller components
  - Replacing CRA with a more modern frontend toolchain
  - Stronger structured medical knowledge or LLM-backed reasoning

## Reconstructed Product Specification

This product is intended to be a secure, educational health guidance workspace for end users. A user signs in with Google, receives a fixed number of symptom-analysis credits, submits symptoms with optional personal context, and gets a structured response containing symptom analysis, diet recommendations, possible causes, risk assessment, red flags, and PubMed literature notes. Each analysis is persisted so the user can review history, see a dashboard, run pattern analysis, and ask follow-up questions with account-specific context.

The product is explicitly educational and not diagnostic. The code consistently reinforces medical disclaimers, red-flag escalation guidance, and professional follow-up recommendations.

## Completion Summary

### Backend tasks

1. Keep `backend.server` as the application entry module and boot the API in degraded mode if Mongo is down.
   - Files: [backend/server.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/server.py), [entrypoint.sh](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/entrypoint.sh), [Dockerfile](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/Dockerfile)
   - Reason: production startup must match the actual import structure and expose health/degraded status clearly.
2. Keep symptom analysis durable and credit-safe.
   - Files: [backend/server.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/server.py), [backend/repositories.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/backend/repositories.py)
   - Reason: a failed save must not silently consume a user credit.

### Frontend tasks

1. Surface backend degradation and expired sessions consistently.
   - Files: [frontend/src/App.js](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/frontend/src/App.js), [frontend/src/services/api.js](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/frontend/src/services/api.js), [frontend/src/utils/session.js](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/frontend/src/utils/session.js)
   - Reason: protected tools should fail clearly when auth expires or the backend is degraded.

### Integration tasks

1. Make container build and runtime consistent with the package layout.
   - Files: [Dockerfile](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/Dockerfile), [entrypoint.sh](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/entrypoint.sh)
   - Dependencies: frontend install/build, backend requirements, Nginx proxy config.
2. Add regression coverage for authenticated analysis behavior without depending on live Google or Mongo services.
   - Files: [test_api.py](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/test_api.py)
   - Dependencies: FastAPI TestClient, monkeypatching route collaborators.

## Local Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB
- A Google OAuth client ID for the Google Identity Services flow

### Backend

```bash
python -m pip install -r backend/requirements.txt
uvicorn backend.server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Environment

Copy [.env.example](C:/Users/abhii/Desktop/Projects/Smart%20Health%20Advisor%20AI/.env.example) into your local environment and provide at minimum:

- `MONGO_URL`
- `MONGO_DATABASE`
- `MONGO_SERVER_SELECTION_TIMEOUT_MS`
- `GOOGLE_CLIENT_ID`
- `JWT_SECRET_KEY`
- `PUBMED_BASE_URL`
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_BACKEND_URL`

## Validation

### Automated

```bash
pytest -q
cd frontend && npm run build
```

### Notes

- Frontend development tests are not included yet; the main frontend validation path is the production build.
- The backend now starts in degraded mode if MongoDB is unavailable, but authenticated and persistence-backed features still require a working MongoDB connection.
- Google login requires a valid browser-based Google client ID configured on both frontend and backend.
