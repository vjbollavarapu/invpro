# Deploying on Vercel (Frontend)

Use this when deploying the Next.js frontend to Vercel. Backend (Django API) must be deployed elsewhere and reachable over HTTPS.

## Steps
1) Install Vercel CLI (from repo root)
```bash
npm i -g vercel   # or: pnpm dlx vercel
```

2) Link the project
```bash
vercel link  # select the project, pick rootDirectory = apps/frontend if prompted
```

3) Environment variables (Vercel Project Settings → Environment Variables)
- `NEXT_PUBLIC_API_URL` = `https://api.mangostack.io/api` (or your backend URL)
- Add any other public flags you need.

4) Deploy
```bash
vercel --prod          # from repo root; uses vercel.json
# if needed:
vercel --prod --cwd apps/frontend
```

## Notes
- `vercel.json` is configured for the frontend at `apps/frontend`.
- Backend must handle CORS/CSRF for the Vercel domain and be served over HTTPS.
- Static Next.js output path: `.next`.

