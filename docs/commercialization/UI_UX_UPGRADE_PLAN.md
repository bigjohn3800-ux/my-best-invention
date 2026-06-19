# UI/UX Commercial Upgrade Plan

## Product Experience Goal

Invention Ventures Hub should feel like a practical operating system for
inventors and early venture builders, not a static introduction page.

The core user journey should be:

1. Understand the service value
2. Sign up
3. Create an invention project
4. Complete guided commercialization steps
5. Upgrade or request paid support
6. Track progress from the dashboard
7. Receive mentor/admin feedback

## Recommended Information Architecture

### Public

- `/`: product overview with a direct CTA
- `/pricing`: free beta or paid plan explanation
- `/login`: returning user access
- `/signup`: account creation
- `/privacy`: privacy policy
- `/terms`: terms of service

### User App

- `/dashboard`: project overview, progress, next actions
- `/projects/new`: create invention project
- `/projects/:id`: project workspace
- `/projects/:id/roadmap`: IP, validation, funding, launch checklist
- `/projects/:id/reviews`: mentor/admin feedback
- `/billing`: plan, entitlement, payment status
- `/settings`: profile, security, notifications

### Admin

- `/admin`: admin overview
- `/admin/users`: user and role management
- `/admin/projects`: invention project management
- `/admin/reviews`: review queue
- `/admin/billing`: plan/payment oversight
- `/admin/audit-logs`: sensitive action history
- `/admin/settings`: service configuration

## First-Screen Upgrade

The first viewport should contain:

- Clear product name
- One-sentence value proposition
- Primary CTA: `Start invention project`
- Secondary CTA: `View commercialization roadmap`
- Trust signal: beta program, expert review, IP/business workflow, or operator name
- A hint of the dashboard or roadmap below the fold

Avoid:

- Long abstract mission copy before the user sees the product
- Decorative sections that do not lead to an action
- Multiple equal-weight CTAs
- Feature explanations without workflow context

## Dashboard UX

Commercial baseline:

- Show active invention projects
- Show next recommended action
- Show progress by stage
- Show missing required information
- Show review/payment/plan status
- Provide empty state for first-time users

Recommended dashboard cards:

- Active projects
- Next step
- Commercialization score
- Pending mentor/admin feedback
- Plan/usage status
- Recent activity

## Project Workspace UX

Each invention project should be organized around action:

- Summary
- Problem and target user
- Solution/invention description
- IP/patent readiness
- Market validation
- Business model
- Funding/government support readiness
- Files and notes
- Reviews and comments

Each section should have:

- Completion state
- Save action
- Validation messages
- Helpful empty copy
- Last updated timestamp

## Forms

Form baseline:

- Labels must be visible
- Required fields marked clearly
- Inline validation
- Submit loading state
- Submit success/failure state
- Save draft where data is long or sensitive
- No destructive action without confirmation

Important forms:

- Signup
- Login
- Project creation
- Project section editing
- Review/comment
- Billing/profile
- Admin role/status updates

## Buttons And Commands

Use consistent button hierarchy:

- Primary: main forward action
- Secondary: alternative safe action
- Tertiary/ghost: low-priority navigation
- Destructive: delete/cancel subscription only with confirmation

Commercial UI should not use many different button shapes, colors, or sizes.

## Mobile UX

Mobile baseline:

- Navigation collapses predictably
- CTAs remain visible without covering content
- Tables become cards or stacked rows
- Long forms use sections
- Buttons and inputs are at least comfortable touch size
- No horizontal scrolling
- Text does not overflow cards or buttons

Admin pages can be optimized for desktop first, but must remain readable on
mobile for urgent checks.

## Admin UX

Admin screens should be dense, quiet, and task-focused:

- Use tables for scanning many records
- Use filters for status, role, date, payment state
- Use detail drawers/pages for decisions
- Show audit history for sensitive changes
- Keep destructive actions visually distinct and confirmed

Admin should not look like a marketing page.

## Stage 1 UI/UX Implementation Target

After source is available, implement:

- Public route CTA cleanup
- Dashboard route or dashboard empty state
- Project creation flow or route skeleton
- Admin route skeleton protected by role
- Shared layout and button/form consistency pass
- Mobile overflow fixes on core pages
- Loading, empty, and error states for primary views
