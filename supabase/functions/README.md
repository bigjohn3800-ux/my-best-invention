# Supabase Edge Functions

## toss-create-checkout

Creates a pending Toss payment order for an authenticated user.

Required secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TOSS_CLIENT_KEY`
- `APP_ORIGIN`

## toss-confirm-payment

Confirms a Toss payment server-side after the Toss client flow returns
`paymentKey`, `orderId`, and `amount`.

Required secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TOSS_SECRET_KEY`
- `APP_ORIGIN`

## Security Notes

- `TOSS_SECRET_KEY` must never be exposed to client code.
- The confirmation function checks the requested amount against the stored
  pending payment amount before calling Toss.
- Paid plans should stay inactive until pricing, refund policy, staging tests,
  and admin visibility are complete.
