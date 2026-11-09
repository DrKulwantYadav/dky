# Reusable camp WhatsApp automation

This document describes the current **camp registration confirmation** flow. It does not describe the retired September ECG registration endpoint or regular appointment messages. The older `whatsapp-ecg-camp-setup.md` covers a separate legacy campaign.

## What happens after a patient registers

1. `POST /api/camps/[slug]/bookings` validates the request and calls `book_public_camp_slot`.
2. The database commits the confirmed registration and one `camp_notification_jobs` row in the same transaction. A WhatsApp failure cannot undo a booking.
3. The API asks QStash to call `/api/qstash/camp-notifications` with the job ID. If publishing fails, the durable job remains pending.
4. The worker verifies the QStash signature, claims the job in the database, and sends an approved WhatsApp utility template through Meta's Graph API. The message values come from the saved attendee name, camp, session date, arrival window, venue, token, and booking reference.
5. The database records Meta API acceptance as `Sent`, or a failed attempt as `Failed` with a retry time. The admin registration page shows this status and offers a rate-limited resend to authorized admins.

The worker leases jobs, checks their notification revision, and skips outdated jobs after a cancellation or slot move. A signed worker request or authenticated cron call may retry due jobs. Neither a token nor a booking reference grants access to patient details.

## Current live state (read-only check, 28 October 2026)

For `fibroscan-camp-oct-29`, the database held **52 registrations**: **46 `Pending` notification jobs** and **6 cancelled jobs**. The highest attempt count was **0**. No job had been claimed or marked sent at that check. This is a dated snapshot, not a live counter. It confirms that the booking-to-outbox step works; it does not identify which deployment setting prevented dispatch.

To refresh counts without selecting patient details, run in Supabase SQL Editor:

```sql
select j.status, count(*) as jobs, max(j.attempts) as highest_attempts
from public.camp_notification_jobs j
join public.camp_registrations r on r.id = j.registration_id
join public.camps c on c.id = r.camp_id
where c.slug = 'fibroscan-camp-oct-29'
group by j.status
order by j.status;
```

## Required deployment configuration

All secret values belong in Vercel server-side environment variables, without a `NEXT_PUBLIC_` prefix. `.env.example` lists the names; the local `.env` currently has no WhatsApp or QStash settings. Vercel's private values have not been verified from this repository.

| Setting | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Restricted database outbox access |
| `QSTASH_TOKEN` | Publish a new job to QStash |
| `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | Verify QStash worker calls |
| `QSTASH_CAMP_NOTIFICATION_URL` | HTTPS URL ending `/api/qstash/camp-notifications` on the deployed site |
| `META_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` | Required by the current WhatsApp configuration helper, including the outbound sender |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API sender credentials |
| `WHATSAPP_GRAPH_API_VERSION` | Graph API version; defaults to `v23.0` |
| `CAMP_WHATSAPP_TEMPLATE_NAME`, `CAMP_WHATSAPP_TEMPLATE_LANGUAGE` | Approved utility template name and language; language defaults to `en` |
| `CRON_SECRET` | Protects `/api/cron/camp-notifications` for recovery processing |

The approved template body needs **seven text variables in this order**: attendee, camp, date, arrival window, venue and address, token, booking reference. The template must be approved for the configured WhatsApp Business Account and language before sends can succeed.

The repository's `vercel.json` has no cron schedule. A scheduler must call authenticated `GET /api/cron/camp-notifications` regularly to recover jobs when QStash publication fails or a worker lease expires. The cron endpoint processes at most 20 due jobs per call.

## Status meanings and current limits

- `Pending`: the job exists but has not been processed. It does **not** mean WhatsApp was sent.
- `Failed`: a send attempt failed. The job has a retry time and stops automatic retries after five attempts.
- `Sent`: Meta's send API accepted the message and returned a message ID. It does **not** prove handset delivery or reading.
- `Cancelled`: the booking or notification revision changed before the job was sent.

The current `/api/whatsapp/webhook` handles inbound messages but does **not** reconcile Meta delivery/read receipts with camp notification jobs. A provider timeout after accepting a message can also lead to a duplicate send on retry; check provider records before a manual resend. The admin resend operation is limited to three recent requests per registration and requires an admin role.

## Safe activation and verification

1. Check the Vercel variable names and values, QStash destination, and approved Meta template. Confirm the deployed worker rejects an unsigned request.
2. Review the existing pending queue **before** scheduling recovery. Once the worker or cron is enabled, it may send all due pending confirmations, including older bookings.
3. Use a controlled test booking with a consented test WhatsApp number and verify one booking, one job, one Meta message ID, and the exact camp/date/window/token text.
4. Verify `Pending → Sent` after API acceptance, or `Pending → Failed` with a retry time when credentials/template are unavailable. Verify a retry does not create another booking.
5. Test cancellation and slot move: an outdated pending message must not send; a move creates a new revision and a message with the new window/token.
6. Add and test delivery-receipt handling if the admin must distinguish Meta acceptance from handset delivery.

Relevant code: `lib/camps/notifications.ts`, `lib/whatsapp/messages.ts`, `app/api/qstash/camp-notifications/route.ts`, `app/api/cron/camp-notifications/route.ts`, `app/api/admin/camp-registrations/resend/route.ts`, and `supabase/migrations/202610210002_reusable_camps_backend.sql`.
