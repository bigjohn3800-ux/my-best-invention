# Stage 1 Implementation Plan

## Goal

Turn the current Invention Ventures Hub prototype into a reproducible,
security-conscious commercial foundation without making irreversible payment or
production deployment decisions too early.

## Stage 1 Definition Of Done

- Source imported into `Invention-Ventures-Hub/`
- Tech stack identified
- Local app runs
- Production build runs
- Existing deployed route compared
- Secrets checked
- `.env.example` created or updated from actual environment usage
- README updated with run/build/deploy commands
- Auth/role/database architecture mapped to the real stack
- First protected route or admin skeleton implemented if the stack allows
- UI/UX upgrade baseline applied to public entry, dashboard, forms, and admin
  skeleton where the stack allows

## Automation Added

The import helper now runs the Stage 1 commercialization audit automatically
after ZIP import.

Audit script:

`scripts\stage1-commercialization-audit.ps1`

Generated outputs:

- `docs/commercialization/AUDIT_OUTPUT.md`
- `.env.example` when environment variables are detected and no template exists

The audit report also lists recommended updates found from the actual stack
signals, such as missing auth, database, payment, run/build scripts, or
potential secret exposure.

## Work Order

### 1. Import And Inspect

- Extract `Invention-Ventures-Hub.zip`
- Confirm whether ZIP contains a nested root folder
- Locate package/dependency files
- Identify frontend framework
- Identify backend/API layer
- Identify database/auth/payment libraries

### 2. Run And Build

- Install dependencies
- Start local dev server
- Capture current routes/screens
- Run production build
- Record any errors

### 3. Security Baseline

- Search for secrets, API keys, tokens, database URLs
- Ensure `.env` is ignored
- Create `.env.example`
- Document required variables
- Check client/server boundary for sensitive code

### 4. Commercial App Foundation

Implement the lowest-risk essentials first:

- Route map documentation
- User role model
- Protected route helper or middleware
- Admin route skeleton
- Dashboard empty/loading/error states
- Form validation baseline
- Public CTA and information hierarchy cleanup
- Mobile overflow and navigation consistency checks
- Shared button/form/card style consistency pass

### 5. Deployment Baseline

- Keep existing Replit deployment live
- Add staging deployment recommendation
- Document deployment commands and environment variables
- Do not switch production until staging is verified

## Implementation Defaults

Use these defaults unless the actual codebase already has a different pattern:

- Keep the existing framework and styling system
- Prefer server-side authorization over client-only checks
- Use Supabase for auth, database, RLS, storage-ready metadata, and admin access
- Use Toss Payments for paid checkout and confirmation
- Keep paid plans inactive until pricing, refund policy, and staging tests are complete
- Treat invention/project content as confidential user data

## Important Decisions Before Later Stages

Payment:

- Free beta first
- Toss Payments/PortOne for Korea-first service
- Stripe for global card-first service

Auth/database:

- Supabase is the selected provider
- Use RLS for owner, reviewer, and admin access
- Do not store passwords manually

Deployment:

- Keep Replit if existing route continuity matters most
- Move to another host only after staging is verified

## Immediate Blocker

Codex cannot currently inspect or execute the project because local shell and
Node file access are failing with a setup refresh error. Once local execution is
available, continue from `Import And Inspect`.
