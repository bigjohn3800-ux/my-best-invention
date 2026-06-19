# Updates Applied

## 2026-06-06

### Vercel Deployment Preparation

- Added `vercel.json` with baseline security headers.
- Added `scripts/vercel-env-from-dotenv.ps1` to import `.env` keys into Vercel
  without printing secret values.
- Updated `scripts/vercel-env-from-dotenv.ps1` to create Vite and Next.js
  public Supabase aliases from `SUPABASE_URL` and the Supabase anon key.
- Added `scripts/deploy-vercel.ps1` for Vercel pull/build/deploy flow.
- Added `docs/deployment/VERCEL_DEPLOYMENT.md`.
- Updated deployment decision documents to use Vercel as the selected target.
- Checked the connected Vercel team `jung's projects`; no Vercel projects are
  currently listed there.

### Supabase And Toss Payments Foundation

- Added Supabase commercial foundation migration with profiles, roles,
  invention projects, roadmap steps, reviews, plans, subscriptions, payments,
  payment events, admin audit logs, and RLS policies.
- Added Toss Payments checkout creation Edge Function.
- Added Toss Payments server-side confirmation Edge Function.
- Added Supabase/Toss environment variable example.
- Updated decision documents to mark Supabase and Toss Payments as selected.

### Stage 1 Import Flow

- Updated `scripts/import-replit-zip.ps1` so it imports the ZIP into the
  dedicated `Invention-Ventures-Hub` folder.
- Improved directory merging so existing documentation folders do not block ZIP
  contents from being imported.
- Connected the import helper to run the Stage 1 commercialization audit after
  import.

### Stage 1 Audit

- Updated `scripts/stage1-commercialization-audit.ps1` to detect stack signals
  from `package.json`.
- Added environment variable detection from `process.env.*` and
  `import.meta.env.*`.
- Added automatic `.env.example` generation when environment variables are
  detected and no template exists.
- Added a "Recommended Updates Found" section to the generated audit report.
- Added basic secret-pattern detection for common API keys and service-role
  variables.

### Remaining Blocker

The local command runtime is still failing with a setup refresh error, so the
actual ZIP source has not been extracted, inspected, run, or built yet.
