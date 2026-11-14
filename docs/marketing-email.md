# Clinic marketing email

The appointment form does not request marketing consent, and appointment requests do not enroll people in marketing emails. A database function for a future separate opt-in flow is present but not used by the appointment API. The clinic can create a draft, preview it and queue it at `/admin/marketing-email`; only active admins and super admins can do so. The recipient list is frozen at queue time. Every send checks the current unsubscribe state again. Email contains a clinic address and unsubscribe link. Unsubscribing does not affect appointment reminders or registrations.

## Setup

Check the **target project** first. The repository's migrations do not prove what the live database contains:

```sql
select to_regclass('public.marketing_email_subscribers') as subscribers,
       to_regclass('public.marketing_email_campaigns') as campaigns,
       to_regclass('public.marketing_email_campaign_deliveries') as deliveries;
select to_regprocedure('public.book_public_appointment_slot_with_marketing(uuid,text,text,text,text,text,text,boolean,boolean)') as booking_opt_in;
```

After the existing admin and appointment slot migrations, apply `202611090001_regular_appointment_digest.sql`, `202611110001_regular_patient_email_reminders.sql`, `202611110002_marketing_email.sql`, then `202611110003_gmail_patient_retry_safety.sql` in an **isolated test Supabase project**, after inspecting that project's schema. Do not run a migration against production without checking existing objects and backups. This change has not applied migrations or sent email.

Set server-only `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, and `GMAIL_SENDER_EMAIL` for the account that authorized `gmail.send`. Set `MARKETING_BASE_URL` to this environment's public HTTPS origin, without a trailing slash, so unsubscribe links resolve to the same database project that sent the email. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side. Test with clinic-controlled email addresses before any real campaign.

## Sending and retries

Saving a draft does not send. The admin must click **Send to opted-in recipients** and confirm the current list count. Queueing freezes the draft and creates one durable row per subscribed address; the browser then sends batches of eight, up to 80 per click. If the browser closes, use **Continue pending sends**. Only definite failures can be retried. Gmail offers no idempotent send key, so uncertain results and expired processing claims require manual reconciliation in Gmail Sent; they cannot be automatically requeued. Attempts stop after five or 23 hours from the first attempt. The status `sent` means accepted by Gmail, not delivered or opened. Each email has an unsubscribe footer and List-Unsubscribe headers. One-click unsubscribe uses a POST endpoint so opening an email preview does not unsubscribe anyone.

Use generic clinic content. Do not import appointment contact lists, add patient conditions to campaign content, or include medical risk scores. Confirm the text, opt-in wording, local email rules, verified sender and test addresses before production sending. This version does not automatically retry a campaign after an admin closes the page; the queue is durable and the admin screen exposes pending and failed counts.
