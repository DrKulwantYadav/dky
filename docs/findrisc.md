# FINDRISC assessment: current save and on-screen report

The diabetes page opens the eight-question assessment at `/conditions/diabetes?assessment=1`. After answering, the visitor enters a name and at least one contact method: a 10-digit Indian mobile number or an email address. The visitor gives consent for clinic follow-up. The server validates the request, calculates the FINDRISC score, and stores the name, contact, answers, score, risk tier, and consent time in Supabase. Only after Supabase confirms the insert does the server return the saved score and tier for an immediate on-screen report. A timeout preserves the submission key so retrying the same details cannot create a second record.

Active, authorised staff can view saved submissions at `/admin/diabetes-risk-leads`. The page shows the total from the database, 25 submissions per page, names, contacts, scores, risk tiers and submission times. Anonymous visitors cannot read those records. The public response contains only the score and tier for the request just submitted; it never returns a list of visitors or their contact details.

**Email reports are disabled.** No submission creates an email job or calls Gmail, QStash, or a report delivery worker. The email template, optional migration and worker implementation remain in the repository for a later phase. Both worker routes return HTTP 410 while disabled. Do not apply the email migration merely to enable the present assessment.

## Required Supabase setup

The configured Supabase project was checked read-only on 8 November 2026. Both `public.findrisc_leads` and `public.findrisc_rate_limits` returned `PGRST205` (missing). No migration or patient-data write was performed during that check.

Before running SQL, confirm the Supabase SQL Editor points to the intended project and compare its live schema with the repository:

```sql
select to_regclass('public.findrisc_leads') as leads,
       to_regclass('public.findrisc_rate_limits') as rate_limits,
       to_regclass('public.admin_profiles') as admin_profiles;
select to_regprocedure('public.is_active_admin()') as active_admin,
       to_regprocedure('public.consume_findrisc_rate_limit(text,integer,integer)') as rate_limit_function;
```

If the FINDRISC tables and rate-limit function are absent and the admin function exists, run the complete [`202611060001_findrisc_leads.sql`](../supabase/migrations/202611060001_findrisc_leads.sql) in the Supabase SQL Editor. This is the **only migration needed now**. If any of these objects already exist, inspect their definitions before applying or adapting the file. The migration has not been run by this code change.

Set `FINDRISC_RATE_LIMIT_SECRET` to a fresh random value of at least 32 characters in the server environment. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side and use the existing `NEXT_PUBLIC_SUPABASE_URL`. Restart the local server or redeploy the target environment after changing environment variables. No FINDRISC QStash settings are needed while email is disabled.

The separate [`202611070001_findrisc_email_reports.sql`](../supabase/migrations/202611070001_findrisc_email_reports.sql) is reserved for a future, separately consented email feature. It may already be present in some environments; the current save API deliberately works with or without it and creates no pending email jobs.

## Verification

1. Apply the required migration and environment settings in the intended test project. Submit a consented assessment with a clinic-controlled contact method. Confirm that the report appears only after the save response and one row exists in `findrisc_leads`.
2. Sign in as active staff and check `/admin/diabetes-risk-leads` for the name, contact, saved score and time. Confirm an anonymous client cannot read the table.
3. Retry a submission with the same key and details after an interrupted response. It must return the original saved score without a duplicate row. Reusing the key with different details must return a conflict.
4. Confirm no email is sent, no report job is enqueued, and the diabetes page sends no answers, score or contact details to advertising scripts or URLs.

The score is a screening estimate, not a diagnosis. The original Finnish 10-year reference odds may not represent an individual in India. A clinician and appropriate blood tests are needed to confirm diabetes.
