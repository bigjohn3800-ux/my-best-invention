# Vercel Deployment

## Decision

Deployment target: Vercel

Connected team:

- `jung's projects` (`team_1jmR0WGh2AGN4co7unU7OoeJ`)

Current Vercel project status:

- No projects are currently listed in the connected team.
- A Vercel project still needs to be created or linked before deployment can finish.

Existing reference site:

https://my-inventors.replit.app

Recommended rollout:

1. Keep the existing Replit URL live.
2. Deploy a Vercel preview.
3. Verify Supabase Auth and public client access on Vercel.
4. Promote Vercel to production.
5. Add Toss and privileged server secrets before enabling payment/admin server flows.

## Current Required Environment Variables

The current local `.env` file is expected to contain only:

- `SUPABASE_URL`
- Supabase anon public key, preferably named `SUPABASE_ANON_KEY`

These are enough for frontend Supabase Auth/client reads that are allowed by RLS.

Depending on the frontend framework, Vercel may also need framework-prefixed
public aliases:

- Vite: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Next.js: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The helper script can create these aliases from the base `.env` values.

Supported local `.env` anon key names:

- `SUPABASE_ANON_KEY`
- `SUPABASE_ANON_PUBLIC_KEY`
- `SUPABASE_PUBLIC_ANON_KEY`

## Add Later For Payment/Admin Server Flows

These should not block the first Vercel deploy, but are required before enabling
Toss checkout confirmation, admin server actions, or privileged database
operations:

- `SUPABASE_SERVICE_ROLE_KEY`
- `TOSS_CLIENT_KEY`
- `TOSS_SECRET_KEY`
- `APP_ORIGIN`

Never expose:

- `SUPABASE_SERVICE_ROLE_KEY`
- `TOSS_SECRET_KEY`

## Scripts Added

From workspace root, for preview:

```powershell
.\scripts\vercel-env-from-dotenv.ps1 -Target preview -AddFrontendAliases
.\scripts\deploy-vercel.ps1
```

For production:

```powershell
.\scripts\vercel-env-from-dotenv.ps1 -Target production -AddFrontendAliases
.\scripts\deploy-vercel.ps1 -Production
```

If no Vercel project exists yet, run the first `vercel` command interactively
from the project root and choose/create the project when prompted. After that,
the scripts can reuse the `.vercel/project.json` link.

## Supabase Settings After Vercel URL Is Known

Update Supabase Auth URLs:

- Site URL: Vercel production URL
- Redirect URLs:
  - `https://YOUR_VERCEL_DOMAIN/**`
  - local development URL, if still used

## Toss Payments Settings After Vercel URL Is Known

Do this later, after Toss keys are added:

- Set `APP_ORIGIN` to the Vercel production URL.
- Set frontend payment success/fail URLs, for example:
  - `https://YOUR_VERCEL_DOMAIN/billing/success`
  - `https://YOUR_VERCEL_DOMAIN/billing/fail`
- Use Toss test keys until the full payment flow is verified.

## Vercel Configuration

`vercel.json` currently adds safe baseline headers:

- `X-Content-Type-Options`
- `Referrer-Policy`
- `X-Frame-Options`
- `Permissions-Policy`

Content Security Policy is intentionally not enforced yet because the current
frontend implementation has not been inspected. Add CSP after verifying the
actual scripts, Supabase domains, Toss widget domains, and assets.

## Launch Checklist

- Vercel preview deploy succeeds
- Production build succeeds
- Supabase Auth redirect URLs include Vercel domain
- Supabase RLS works with anon key
- `.env` is not committed
- Production keys are stored only in Vercel/Supabase secret managers
- Toss server secrets are added before paid checkout goes live
