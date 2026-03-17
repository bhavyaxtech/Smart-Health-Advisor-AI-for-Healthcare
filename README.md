# Smart Health Advisor AI

Smart Health Advisor AI is a split-deployment full-stack application:

- frontend: Next.js app deployed independently on Vercel
- backend: FastAPI app deployed independently on Render
- database: MongoDB Atlas or another external MongoDB deployment

The frontend now follows a `landing page -> login -> application workspace` flow and always calls the backend through a full URL from `NEXT_PUBLIC_BACKEND_URL`.

## Architecture

```text
Browser
  -> Vercel-hosted Next.js frontend
      -> NEXT_PUBLIC_BACKEND_URL + /api/*
          -> Render-hosted FastAPI backend
              -> Google token verification
              -> MongoDB
              -> PubMed
```

## Runtime Configuration

### Frontend

Create `frontend/.env` from [frontend/.env.example](C:\Users\abhii\Desktop\Projects\Smart Health Advisor AI\frontend\.env.example).

Required variables:

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Example:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_client_id
```

### Backend

Create `backend/.env` from [backend/.env.example](C:\Users\abhii\Desktop\Projects\Smart Health Advisor AI\backend\.env.example).

Required variables:

- `GOOGLE_CLIENT_ID`
- `JWT_SECRET_KEY`
- `MONGO_URL`
- `CORS_ALLOW_ORIGINS`

Optional:

- `PORT`

## Local Development

### Backend

```bash
python -m pip install -r backend/requirements.txt
uvicorn backend.server:app --reload --host 0.0.0.0 --port 10000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For local development, set:

- `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:10000`
- `CORS_ALLOW_ORIGINS=http://localhost:3000`

## Deployment

### Vercel

- Framework preset: Next.js
- Root directory: `frontend`
- Build command: `npm run build`
- Environment variables:
  - `NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_client_id`

### Render

- Start command: `uvicorn backend.server:app --host 0.0.0.0 --port 10000`
- Environment variables:
  - `GOOGLE_CLIENT_ID`
  - `JWT_SECRET_KEY`
  - `MONGO_URL`
  - `CORS_ALLOW_ORIGINS=https://your-frontend.vercel.app`
  - `PORT=10000`

### Google Authentication

- Frontend uses `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Backend verifies ID tokens using `GOOGLE_CLIENT_ID`
- The app supports Google ID token flow only
- No redirect-based OAuth flow is used

## Validation

```bash
pytest -q
cd frontend && npm run build
```
