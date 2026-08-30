# Admin CRM architecture

## Scope

The CRM is part of the existing Next.js App Router application. Public website registration writes through a narrowly scoped database function. The `/admin/*` area uses Supabase Authentication, server-rendered data queries, role checks, and Row Level Security. WhatsApp webhooks, conversations, sending, settings, tokens, and message fields are intentionally deferred.

## Application structure

```text
app/
  admin/
    login/                       Admin sign-in
    dashboard/                   KPIs and charts
    patients/                    Patient directory
    free-camp-registrations/     Camp registrations
    regular-registrations/       Regular consultations
    camps/                       Campaigns and sessions
    reminders/                   Reminder queue
    reports/                     Filtered performance reports
    settings/                    Profile and role-aware configuration
  api/
    admin/                       Protected CRM endpoints
    camp-registration/           Public website registration
components/admin/                Reusable dashboard, table, form, badge, chart UI
lib/
  supabase/                      Browser, server, and middleware clients
  admin/                         Authorization, queries, validation, CSV helpers
supabase/migrations/             Versioned PostgreSQL schema and RLS
```

## Data model

- `patients` is the single person record, deduplicated by normalized phone number.
- `regular_registrations` and `camp_registrations` are intentionally separate workflows.
- `camps` owns configurable `camp_sessions`; dates are never permanently hard-coded in application code.
- `reminders` can reference either type of registration.
- `admin_profiles` extends `auth.users` with `super_admin`, `admin`, or `staff` authorization.
- `admin_activity_logs` provides an immutable audit trail.

## Security and RLS

- Supabase Auth owns credentials and sessions.
- Every admin route performs a server-side user and active-role check.
- RLS denies anonymous CRM reads and writes.
- Active Super Admin and Admin users can manage operational records.
- Staff can read operational records and update confirmation/attendance workflows through protected server APIs.
- Admin profiles can only be managed by Super Admins.
- The public camp form can only call `submit_public_camp_registration`, which validates inputs and exposes no patient lists.
- No service-role key is sent to browsers.

## APIs

- `POST /api/camp-registration` — validated public camp registration.
- `GET/PATCH /api/admin/camp-registrations` — paginated search, filters, and status updates.
- `GET/PATCH /api/admin/regular-registrations` — paginated search, filters, and status updates.
- `GET /api/admin/patients` — paginated patient search.
- `GET /api/admin/export?type=camp|regular` — filtered CSV export.

## Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Privileged operations use authenticated RLS rather than a browser-exposed service key. A service role key can be added later only for trusted background jobs.

## Delivery roadmap

1. Apply schema, indexes, functions, seed camp and sessions, and RLS.
2. Create the first Supabase Auth user and link it as Super Admin.
3. Enable protected admin navigation and dashboard.
4. Enable registration management, search, filters, pagination, edits, and CSV.
5. Enable camps, sessions, reminders, reports, settings, and audit logs.
6. Add WhatsApp as a separate future integration phase.
