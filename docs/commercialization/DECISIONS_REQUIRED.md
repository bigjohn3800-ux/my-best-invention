# Decisions Required

These decisions are important enough to ask the owner before implementation.

## Payment

Decision:

- Toss Payments

Recommended for Stage 1:

Prepare Toss Payments checkout and confirmation flow. Keep paid plans inactive
until pricing, refund policy, and staging tests are complete.

## Data Sensitivity

Question:

Will users enter confidential invention, patent, prototype, funding, or business
strategy information?

Recommended assumption:

Yes. Treat all invention/project data as private and owner-scoped by default.

## Mentor/Reviewer Access

Question:

Are mentors/reviewers internal staff only, or can external experts sign in?

Recommended Stage 1 assumption:

Internal only. Add external reviewer support later after permissions are stable.

## Existing Deployment Route

Decision:

Use Vercel as the new deployment target. Keep
`https://my-inventors.replit.app` live as the reference/continuity route until
the Vercel preview is verified.

## Auth And Database Provider

Decision:

Use Supabase for auth, database, row-level security, and admin-friendly
operations.
