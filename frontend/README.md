# Frontend

This frontend is a Create React App single-page client for Smart Health Advisor AI.

## Commands

```bash
npm install
npm start
npm run build
```

## Required Environment

- `REACT_APP_BACKEND_URL`
- `REACT_APP_GOOGLE_CLIENT_ID`

## Runtime Notes

- Google sign-in is required for all protected tools.
- The client now handles three important backend states explicitly:
  - expired session (`401`) -> clears local session and prompts sign-in
  - degraded protected service (`503`) -> keeps the app open and shows a warning state
  - unreachable backend (`status 0`) -> shows an offline-style error and marks the service unavailable
- The production build is the main frontend validation path in this repo.
