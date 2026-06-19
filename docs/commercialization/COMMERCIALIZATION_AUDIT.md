# Invention Ventures Hub Commercialization Audit

## Scope

Active source:

`C:\Users\onlyj\Downloads\Invention-Ventures-Hub.zip`

Target project folder:

`G:\내 드라이브\21. 코덱스 프로그램\20. 발명창업\Invention-Ventures-Hub`

Existing deployment reference:

https://my-inventors.replit.app

## Current Audit Status

Source-code inspection is not complete yet. The local command runtime is
currently failing before it can list, extract, read, install, or run the
project. Treat this document as the commercialization audit framework and
implementation sequence, not as a final code-level audit.

Related commercialization documents:

- `UI_UX_UPGRADE_PLAN.md`
- `AUTH_DB_ADMIN_BLUEPRINT.md`
- `SECURITY_DEPLOYMENT_BASELINE.md`
- `STAGE1_IMPLEMENTATION_PLAN.md`
- `DECISIONS_REQUIRED.md`
- `SUPABASE_TOSS_IMPLEMENTATION.md`

## Service Definition

Recommended commercial positioning:

Invention Ventures Hub should become a guided workspace for inventors and early
venture founders who need to turn an invention idea into a more investable,
protectable, and executable business plan.

Primary users:

- Inventor or founder: records ideas, evaluates feasibility, tracks progress
- Mentor or reviewer: reviews invention/business materials and leaves feedback
- Admin/operator: manages users, submissions, payments, content, and support

Primary problems to solve:

- Ideas are scattered and hard to develop into business-ready plans
- Inventors do not know the next step for IP, validation, funding, and launch
- Operators need a structured way to review and manage many invention projects

## Current Features To Verify

After source import, verify:

- Landing/home page
- Idea or invention creation flow
- Dashboard or project list
- Detail page for invention records
- User input forms
- Saved state persistence
- Login/signup existence
- Admin page existence
- Payment or pricing page existence
- API/server/database usage
- Deployment and environment settings

## Commercialization Gap Checklist

### Design

Expected commercial baseline:

- Clear first-screen value proposition
- Obvious primary CTA
- Mobile-first responsive layout
- Consistent buttons, forms, cards, typography, and spacing
- Real product workflow shown before marketing copy
- Empty states, loading states, and error states

Common likely gaps to check:

- Prototype-style decorative sections
- Unclear user path after landing
- No dashboard hierarchy
- Mobile text/button overflow
- Missing form validation messages

### Signup And Login

Expected commercial baseline:

- Email/password or social login
- Verified email flow
- Password reset
- Session persistence
- Logout
- Terms/privacy consent

Must not do:

- Store passwords manually
- Keep auth only in browser local state for production
- Expose admin privileges through client-only checks

### Permissions

Recommended roles:

- `user`: normal inventor/founder
- `mentor`: can review assigned projects
- `admin`: can manage all users, projects, payments, and content

Expected controls:

- Server-side role checks
- Owner-only access to private invention records
- Admin-only access to admin pages and management APIs
- Audit trail for sensitive changes

### Payment

Payment provider decision:

- Toss Payments

Stage 1 implementation:

- Prepare paid checkout records
- Confirm payments server-side
- Keep paid plan inactive until price/refund/staging checks are complete
- Never trust client-submitted amount without comparing it to DB order amount

### Database

Expected commercial baseline:

- Real database, not browser-only persistence
- User table/profile table
- Invention/project records
- Review/comment records
- Subscription/payment entitlement records
- Admin activity logs

Recommended core entities:

- users
- profiles
- invention_projects
- project_steps
- project_reviews
- project_files
- subscriptions
- payments
- admin_audit_logs

### Admin Page

Minimum admin scope:

- User list
- Project/submission list
- Project detail and review status
- Payment/subscription status
- Manual role management
- Basic content/settings management
- Support/contact submission list

### Security

Expected baseline:

- Secrets only in environment variables
- No real `.env` committed
- Server-side auth and role checks
- Input validation on client and server
- Rate limiting on auth/contact/payment APIs
- Secure headers
- CORS restricted to allowed origins
- File upload type/size restrictions
- No sensitive data in logs

### Deployment

Expected baseline:

- Git-based source control
- Separate local, staging, and production environments
- Build command documented
- Environment variables documented
- Production deployment rollback path
- Error logging and analytics

Recommended deployment decision:

Keep the existing Replit route live until the source runs locally and a staging
deployment has been verified. Do not switch production first.

## Priority

### 필수

- Import and inspect source
- Document tech stack, run command, build command, environment variables
- Fix any secret exposure
- Upgrade public entry UI/UX and primary user journey
- Add dashboard/project/admin route structure where missing
- Add production-ready auth plan
- Add database schema plan
- Add admin/role architecture
- Add deployment/staging plan
- Verify local run and build

### 중요

- Implement signup/login with verified provider
- Implement protected dashboard
- Implement invention/project persistence
- Implement admin user/project management
- Implement server-side authorization
- Add form validation and error states
- Add security headers/rate limiting

### 나중

- Real payment integration
- AI-assisted invention analysis
- Mentor marketplace
- File uploads and document generation
- Notification email/SMS
- Analytics dashboard
- Mobile app wrapper

## Stage 1 Implementation Target

Stage 1 should not start with payment. It should establish the commercial
foundation:

1. Make the project reproducible locally.
2. Identify actual stack and routing.
3. Add environment template and secret hygiene.
4. Add auth/role/database design matching the stack.
5. Implement or prepare protected dashboard and admin route skeleton.
6. Add README run/build/deploy instructions.
7. Run local and build tests.

## Decisions Needed From Owner

Ask before implementing:

- Payment provider and market: Korea-only, global, or free beta first
- Auth provider preference: Supabase, Firebase, Auth.js, Clerk, Replit Auth, or existing
- Whether invention submissions contain confidential patent/business information
- Whether mentors/reviewers are internal only or external users
- Whether the existing Replit URL must remain the production URL
