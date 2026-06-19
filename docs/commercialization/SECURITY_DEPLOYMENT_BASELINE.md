# Security And Deployment Baseline

## Security Baseline

### Secrets

- Never commit `.env`.
- Never expose service-role keys to client code.
- Use deployment secret manager for production values.
- Keep `.env.example` with names only, no real values.

### Authentication

- Do not store passwords manually.
- Use verified auth provider.
- Require server-side session validation.
- Add password reset and email verification before launch.

### Authorization

- Client-side route hiding is not enough.
- Every sensitive read/write must check role and ownership server-side.
- Admin pages must require admin role.
- Mentor/reviewer access must be assignment-based.

### User Data

Treat invention data as confidential:

- Restrict project access by owner or assigned reviewer
- Avoid logging raw invention descriptions
- Add file upload limits before enabling uploads
- Add delete/export policy before launch

### Input Validation

Validate:

- Signup/login fields
- Project creation fields
- Review/comment fields
- Admin role/status changes
- Payment webhook payloads later

### Rate Limiting

Add rate limiting to:

- Login
- Signup
- Password reset
- Contact/inquiry forms
- Payment webhook endpoints
- AI generation endpoints, if added

### Headers

Recommended production headers:

- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- X-Frame-Options or frame-ancestors
- Permissions-Policy

## Deployment Baseline

Selected deployment target:

- Vercel

### Environments

Use three environments:

- Local
- Staging
- Production

### Existing Route

Keep the existing Replit deployment route live while staging is prepared:

https://my-inventors.replit.app

Do not replace it until:

- Local build passes
- Staging build passes
- Environment variables are copied safely
- Auth callback URLs are updated
- Database permissions are verified
- Admin account exists

### Required Deployment Documentation

Document:

- Install command
- Dev command
- Build command
- Start command
- Environment variables
- Database migration command
- Rollback process

## Stage 1 Deployment Decision

Default:

Keep the existing Replit production route and create a Vercel preview/staging
deployment first.

Move to a new production deployment only if:

- The current platform cannot support required backend features
- Logs, domains, preview deployments, or team workflow are insufficient
- Source is under Git and staging is verified

## Launch Blockers

Do not launch paid production until these are complete:

- Privacy policy
- Terms of service
- Auth provider configured
- Database access rules verified
- Admin access protected
- Payment/refund policy chosen
- Error logging configured
- Backup/export process defined
