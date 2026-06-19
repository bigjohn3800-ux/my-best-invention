# Supabase And Toss Payments Implementation

## Decisions

- Auth/DB provider: Supabase
- Payment provider: Toss Payments
- Stage 1 payment mode: prepare paid checkout, but keep paid plans inactive
  until pricing and legal policies are finalized

## Added Files

- `supabase/migrations/202606060001_commercial_foundation.sql`
- `supabase/functions/toss-create-checkout/index.ts`
- `supabase/functions/toss-confirm-payment/index.ts`

## Supabase Foundation

The migration adds:

- Profiles synced from Supabase Auth users
- Roles: `user`, `mentor`, `admin`
- Invention projects
- Project roadmap steps
- Reviewer assignments
- Reviews
- Project files metadata
- Plans
- Subscriptions
- Toss payment records
- Payment event logs
- Admin audit logs
- RLS policies for owner, reviewer, and admin access

## Toss Payments Flow

### 1. Create Checkout

Function:

`toss-create-checkout`

Input:

```json
{
  "planId": "founder_pro"
}
```

Behavior:

- Validates the signed-in user
- Loads the selected active paid plan from Supabase
- Creates a pending payment row
- Returns Toss client checkout data

### 2. Confirm Payment

Function:

`toss-confirm-payment`

Input:

```json
{
  "paymentKey": "TOSS_PAYMENT_KEY",
  "orderId": "ivh_xxx",
  "amount": 49000
}
```

Behavior:

- Validates the signed-in user
- Finds the pending order owned by the user
- Compares request amount against the stored DB amount
- Calls Toss Payments confirm API
- Marks payment as confirmed or failed
- Updates the user's subscription
- Records a payment event

## Important Security Rule

Never trust the amount from the client. The confirm function compares the client
amount against the stored server-side order amount before calling Toss.

## Required Environment Variables

### Supabase

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Toss Payments

- `TOSS_CLIENT_KEY`
- `TOSS_SECRET_KEY`

### App

- `APP_ORIGIN`

## Activation Steps

1. Run the Supabase migration.
2. Deploy Supabase Edge Functions.
3. Add environment variables to Supabase function secrets.
4. Set a real price for the `founder_pro` plan.
5. Set `founder_pro.active = true`.
6. Connect the frontend billing page to `toss-create-checkout`.
7. Connect the Toss success callback to `toss-confirm-payment`.
8. Test with Toss test keys.
9. Switch to live keys only after staging verification.

## Launch Blockers Before Live Payment

- Pricing confirmed
- Refund/cancellation policy written
- Terms and privacy pages published
- Toss test payment confirmed end to end
- Admin can see payment/subscription status
- Failed payments are visible and recoverable
- Production secret keys stored only in secret manager
