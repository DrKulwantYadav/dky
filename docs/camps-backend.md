# Reusable camps backend: migration and release checklist

No migration was run against production by this task. Repository migrations are not evidence of the deployed schema. Back up the live database and inspect it in a read-only session before applying anything. Apply `202610210001_reusable_camps_admin.sql`, then `202610210002_reusable_camps_backend.sql`, then `202610210003_short_camp_tokens.sql` in order; skip files already successfully applied in the live database. Do not publish a camp between required migrations and application deployment. Migration 003 adds an admin-configured three-letter place code; set it on each published camp (for example, BHW) before expecting short tokens. Existing issued tokens and registrations are preserved.

## Live-schema preflight (read-only)

Compare `supabase_migrations.schema_migrations` with repo filenames. Query `information_schema.columns` and `pg_catalog.pg_constraint` for `camps`, `camp_sessions`, `camp_slots`, `camp_registrations`, `patients`, `reminders`, and `admin_profiles`. Specifically inspect whether `participant_name`, `slug`, `submission_key`, and `camp_slot_id` already exist; whether `patients.phone` is unique; whether alternate camp registration RPCs or integration writers have appeared; and whether trigger/policy names conflict. Check existing data before adding composite relationships:

```sql
select r.id from public.camp_registrations r join public.camp_sessions s on s.id=r.camp_session_id
 where r.camp_session_id is not null and s.camp_id<>r.camp_id;
select sl.id from public.camp_slots sl join public.camp_sessions s on s.id=sl.session_id where sl.camp_id<>s.camp_id;
select r.id from public.camp_registrations r join public.camp_slots sl on sl.id=r.camp_slot_id
 where r.camp_id<>sl.camp_id or r.camp_session_id<>sl.session_id;
select phone,count(*) from public.patients group by phone having count(*)>1;
```

The last query should be empty under the existing unique constraint. Also check for `camp_slot_id is not null and camp_session_id is null`. Fix any ownership mismatches deliberately before validating `NOT VALID` constraints; do not delete historical registrations. After migration, validate `camp_slots_session_camp_fk`, `camp_registration_slot_ownership_fk`, `camp_registration_slot_requires_session`, and `camp_registration_session_ownership_fk` once the historical rows pass. Existing registrations without a slot remain nullable and visible; they do not consume a new slot. Confirm `anon`/`authenticated` cannot execute `submit_public_camp_registration` or insert/update `camp_registrations` directly. The dated thyroid screening RPC and historical page were left intact; verify no active campaign invokes it for new camp bookings.

## Server configuration

Configure `SUPABASE_SERVICE_ROLE_KEY` only on the server; `NEXT_PUBLIC_SUPABASE_URL` and publishable key remain as before. Set `CAMP_RATE_LIMIT_SECRET` to a random 32+ character value. Configure `QSTASH_TOKEN`, signing keys, and `QSTASH_CAMP_NOTIFICATION_URL` pointing over HTTPS to `/api/qstash/camp-notifications`. Set `CRON_SECRET` and schedule authenticated `GET /api/cron/camp-notifications` every minute to drain pending jobs when QStash publishing fails or a worker lease expires. Never expose these secrets to the browser.

For WhatsApp, configure Meta credentials plus an approved utility template named by `CAMP_WHATSAPP_TEMPLATE_NAME` (language `CAMP_WHATSAPP_TEMPLATE_LANGUAGE`, default `en`). The template body has seven text variables in this order: attendee, camp, date, arrival window, venue/address, token, booking reference. Without credentials or an approved template, the database booking still confirms immediately; delivery is shown as Pending until processed, then Failed with retry timing. Do not describe that as delivered. Meta API acceptance is not the same as handset receipt. Jobs are leased and revision-checked; cancelling or moving invalidates pending jobs/reminders. A provider timeout after accepting a message remains an at-least-once delivery edge case; reconcile before manual resend.

## Verification before enabling ads

Use an isolated local Supabase stack, apply the migration order there, create a test admin profile, and run `node scripts/test-camps-integration.mjs` with local-only `CAMP_TEST_*` variables. The script rejects a non-local URL, creates test fixtures (left in the local database), and exercises two distinct future camps, concurrent final-place bookings, idempotency, family identity, cancellation/reactivation/moves, publication states, outbox isolation, and camp-filtered pagination. Also inspect `/admin/camps`, the copied `/camps/[slug]` URL, registration confirmation, filtered CSV, notification state, and the second camp with different hours. Test staff denial (the script can do so if optional staff credentials are supplied), QStash signature rejection, and regular consultation manually or in staging. Do not use real patient data in tests.

No booking-details retrieval endpoint was added. The reference/token alone never authorizes patient information. Public HTTP endpoints include aggregate remaining capacity, but the public page displays only Available/Full/Closed, not the numeric count. The server/database still check actual capacity. New tokens use the configured place code, slot start time, and slot sequence (such as `BHW-11AM-001`). The same human token can recur on another date; always use camp/date/window context or the unique booking reference for lookup. The browser keeps its confirmation locally in the same tab after a committed response.
