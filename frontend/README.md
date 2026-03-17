# Frontend

This frontend is now a Next.js app-router project intended for Vercel deployment.

## Environment

Create `frontend/.env` from [frontend/.env.example](C:\Users\abhii\Desktop\Projects\Smart Health Advisor AI\frontend\.env.example).

Required:

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Commands

```bash
npm install
npm run dev
npm run build
npm run start
```

## Deployment Notes

- All API requests use the absolute backend base URL from `NEXT_PUBLIC_BACKEND_URL`
- No proxy fallback is used
- Google sign-in uses `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- The production build does not require the backend to be reachable during build time
- The app flow is `landing page -> login -> application workspace`
