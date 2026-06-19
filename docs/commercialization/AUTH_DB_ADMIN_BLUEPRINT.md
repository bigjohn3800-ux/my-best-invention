# Auth, Database, And Admin Blueprint

## Recommended Stage 1 Assumptions

Until the real source stack is inspected:

- Keep any existing auth/database provider if already implemented.
- If none exists, use Supabase as the default foundation.
- Treat all invention data as private and commercially sensitive.
- Start as free beta; prepare plan/entitlement fields before real payment.
- Make admin and reviewer permissions server-enforced, not client-only.

## Roles

### `user`

Default inventor/founder account.

Can:

- Create and edit own projects
- View own roadmap, reviews, plan status
- Request review or support

Cannot:

- View other users' projects
- Change own role
- Access admin screens

### `mentor`

Reviewer or expert account.

Can:

- View assigned projects
- Add review comments
- Update review status

Cannot:

- View all projects unless assigned
- Manage users or billing
- Change roles

### `admin`

Operator account.

Can:

- Manage users
- Manage roles
- View and manage all projects
- Assign mentors
- Review billing/plan state
- View audit logs

## Core Data Model

### profiles

- id
- email
- name
- role
- company
- phone
- created_at
- updated_at

### invention_projects

- id
- owner_id
- title
- summary
- problem
- target_customer
- solution
- ip_status
- market_status
- business_model
- stage
- visibility
- created_at
- updated_at

### project_steps

- id
- project_id
- step_key
- title
- status
- due_date
- completed_at
- updated_at

### project_reviews

- id
- project_id
- reviewer_id
- status
- score
- comment
- created_at
- updated_at

### project_files

- id
- project_id
- owner_id
- file_name
- file_path
- file_type
- file_size
- created_at

### plans

- id
- name
- price
- currency
- features
- active

### subscriptions

- id
- user_id
- plan_id
- status
- provider
- provider_customer_id
- provider_subscription_id
- current_period_end
- created_at
- updated_at

### admin_audit_logs

- id
- actor_id
- action
- target_type
- target_id
- metadata
- created_at

## Permission Rules

Minimum required rules:

- Users can read/write only their own projects.
- Mentors can read projects assigned to them.
- Mentors can write reviews only for assigned projects.
- Admins can read/write all operational data.
- Role changes require admin permission.
- Billing state changes require admin or payment webhook permission.

## Signup/Login Requirements

Commercial baseline:

- Signup with email/password or social provider
- Login
- Logout
- Password reset
- Email verification
- Session persistence
- Terms and privacy consent

Do not implement custom password storage.

## Admin Page Requirements

### Admin Home

- Total users
- Active projects
- Pending reviews
- Billing/plan summary
- Recent admin activity

### User Management

- Search users
- Filter by role/status
- View user detail
- Change role
- Disable account if needed

### Project Management

- List all projects
- Filter by stage/status
- Open project detail
- Assign mentor
- Change review state

### Review Queue

- Pending review items
- Assigned reviewer
- Last activity
- Review decision

### Audit Logs

- Actor
- Action
- Target
- Timestamp
- Metadata

## Stage 1 Implementation Order

1. Confirm actual stack.
2. Add or map auth provider.
3. Add profile/role model.
4. Add protected route helper.
5. Add user dashboard protection.
6. Add admin route skeleton.
7. Add project ownership checks.
8. Add `.env.example`.
9. Add security notes and deployment variables.
