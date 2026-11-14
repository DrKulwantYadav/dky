# Nightly regular appointment email

The nightly digest includes a staff summary and a separate next-day patient reminder. Neither email confirms an appointment, changes either registration status, or takes payment. The admin dropdown's **Confirm** changes `confirmation_status`; **Mark booked** changes `registration_status`. Staff emails show both fields separately. A patient reminder only asks someone with a booked appointment to check in at reception.

At approximately 10 pm IST, the production Vercel Cron calls `GET /api/cron/regular-appointment-digest` (`30 16 * * *` UTC). The route requires `Authorization: Bearer $CRON_SECRET`. A Vercel Hobby schedule may run later within the scheduled hour. The first successful invocation freezes a snapshot for that IST date:

- Requests submitted since 00:00 IST up to the snapshot time.
- Requests with a preferred appointment date of the next IST day, including cancelled and no-show records clearly marked as such.

Each active `admin_profiles` user with a verified Supabase Auth email gets a separate copy. The email includes patient name, mobile, preferred date/time, registration status and confirmation status. It excludes visit reason, notes, fee, and patient email. Empty sections explicitly say there were no requests. The admin dashboard remains the current source of truth; changes after the snapshot are not reflected in that night's email.

The same cron creates a separate reminder delivery for each tomorrow-dated request marked `Appointment Booked` with a valid `requester_email` and a non-rejected confirmation status. Email is optional on the appointment form; patients without it are counted in Reports and cannot receive an email reminder. The reminder contains the appointment date, arrival time, clinic location, and a request to check in with reception. It contains no health reason, payment information, or patient portal link. Before sending, the database checks that the booking date, time, status, name and email still match the snapshot. Changed or cancelled bookings are skipped. A change after provider acceptance cannot retract an email already sent.
Patient reminders are claimable only on the snapshot's IST date, so a delayed retry cannot send a “tomorrow” email after midnight. Staff digest retry rules are separate.

## Database and configuration

Before applying anything, check the target Supabase project and live schema:

```sql
select to_regclass('public.regular_registrations') as registrations,
       to_regclass('public.appointment_slots') as slots,
       to_regclass('public.admin_profiles') as admins,
       to_regclass('public.regular_appointment_digest_runs') as digest_runs,
       to_regclass('public.regular_appointment_digest_deliveries') as digest_deliveries;
select to_regprocedure('public.prepare_regular_appointment_digest(text)') as prepare_digest;
```

If the digest objects are absent and the existing appointment/admin objects match the repository, apply `supabase/migrations/202611090001_regular_appointment_digest.sql`, then `supabase/migrations/202611110001_regular_patient_email_reminders.sql`, `supabase/migrations/202611110002_marketing_email.sql`, and `supabase/migrations/202611110003_gmail_patient_retry_safety.sql` in the intended test project first. They create restricted snapshot/delivery tables and service-role-only functions. The final migration prevents duplicate Gmail sends after uncertain or expired attempts. Do not rerun them against a project where any of these objects already exist without inspecting their definitions. No production migration is applied by this code change.

Set these **server-only** Vercel Production variables before enabling the cron deployment:

- `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` (existing database connection).
- `CRON_SECRET` (existing protected cron secret; generate a long random value if absent).
- `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` from the Google Cloud Web OAuth client.
- `GMAIL_REFRESH_TOKEN` from a send-only offline authorization by the actual sending mailbox.
- `GMAIL_SENDER_EMAIL` equal to that authorized mailbox.

Do not use a `NEXT_PUBLIC_` prefix for secrets. Redeploy after adding or changing variables. This feature does not activate the dormant FINDRISC patient-email feature.

For the existing Google Cloud Web OAuth client, add `http://127.0.0.1:8765/oauth2/callback` to its authorized redirect URIs. On a trusted local computer run `node scripts/gmail-authorize.mjs <path-to-private-client-JSON>`, open the URL printed in that terminal, and authorize the **actual sending mailbox**. Keep the returned client secret and refresh token out of Git and browser code. Set `GMAIL_SENDER_EMAIL` to the same mailbox. To send from `drkulwantyadavmedicine@gmail.com`, that account must itself grant consent; a token from the Bhardwaj test account will send as Bhardwaj. While the OAuth app remains in Google Cloud Testing, the Gmail refresh token may expire after seven days; complete production OAuth verification/configuration before relying on unattended nightly mail.

## Delivery and checks

The database has one immutable snapshot per IST date and separate staff and patient delivery rows. The worker claims each row with a database lock and sends through Gmail. It records provider acceptance, failure or an uncertain response. A repeated cron call cannot create another snapshot or delivery. Delivery status and admin-only retry controls appear in `/admin/reports`.

Gmail does not provide an idempotent send key. The application stops automatic claiming after 23 hours from the snapshot for any attempted delivery. An uncertain response is not claimed as sent and cannot be retried automatically. An interrupted attempt becomes `uncertain` after its two-minute lease; staff must reconcile it in Gmail Sent. The admin retry is limited to definite failures and five attempts and is audited. Cron failures are not silently reported as successful. A provider `sent` status means Gmail accepted the message, not that the recipient opened it.

Before production: verify that every intended recipient has an active admin profile and verified Auth email; authorize the intended Gmail sender; apply the migrations to a test database; run an authorised cron invocation with clinic-controlled test registrations and addresses; check both non-empty and zero-registration emails, delivery status, and duplicate-call behavior. Do not use real patient data in development email tests. The repository has no local PostgreSQL test service, so database concurrency tests must run against an isolated test project before production use.
