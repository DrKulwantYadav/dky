# WhatsApp ECG camp integration setup

This integration uses the existing `patients`, `camps`, `camp_sessions`, `camp_registrations`, and `system_logs` tables. It does not require or include a database migration.

## Meta setup

1. In the Meta app, configure the WhatsApp webhook callback as `https://www.drkulwantyadav.com/api/whatsapp/webhook` and use the same random value stored as `WHATSAPP_VERIFY_TOKEN`.
2. Subscribe the WhatsApp Business Account webhook to `messages`.
3. Set the Meta app secret as `META_APP_SECRET`, the permanent system-user access token as `WHATSAPP_ACCESS_TOKEN`, and the sending number ID as `WHATSAPP_PHONE_NUMBER_ID`.
4. Build/publish the WhatsApp Flow with these response field names:
   - `patient_name` (text, 2–80 characters)
   - `age` (integer, 1–120)
   - `registration_for` (`self`, `parent`, `sibling`, or `other`)
5. Attach the published Flow to the Click-to-WhatsApp campaign.

The registrant's WhatsApp sender number is authoritative; the Flow must not ask the patient to re-enter a phone number.

## Deployment secrets

Copy the names from `.env.example` into the deployment environment. Generate a high-entropy value for `WHATSAPP_VERIFY_TOKEN`. Copy `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, and `QSTASH_NEXT_SIGNING_KEY` from the Upstash QStash dashboard. Never place the Meta token, app secret, Supabase service-role key, QStash token, or signing keys in client code or in a `NEXT_PUBLIC_` variable.

Set `QSTASH_FOLLOW_UP_URL` to `https://www.drkulwantyadav.com/api/qstash/whatsapp-follow-up`. QStash holds each follow-up for one minute and then calls this endpoint. The endpoint accepts only correctly signed QStash requests and checks the existing outbox record before sending, so a patient reply still cancels the message. No Vercel cron is used, which keeps deployment compatible with the Vercel Hobby plan.

## Production checks

1. Verify the callback in Meta and confirm unsigned POST requests receive HTTP 401.
2. Submit a test Flow and confirm the registration appears under **Admin → Free camp registrations** with source **Meta Ads**.
3. Confirm the personalized acknowledgement arrives.
4. Reply within one minute and confirm the seven-item list appears and the share message does not.
5. Repeat without replying and confirm the share message arrives after the one-minute threshold.
6. Send a new ordinary message from a number that did not register through the Meta campaign and confirm the seven-item assistance menu appears.
7. Verify options 1–6 return the registration, schedule, location, family-registration, sharing, and website responses.
8. Select option 7 and confirm the staff-busy acknowledgement is sent once and subsequent messages receive no automated response for 24 hours.
9. Show the menu twice to a test number, send another ordinary message, and confirm the same acknowledgement and automation pause occur instead of a third menu.
10. Rotate the temporary token used during setup to a permanent least-privilege system-user token before launch.

Free-form messages are valid while the user-initiated 24-hour WhatsApp conversation window is open. If Meta classifies a campaign path outside that window, create approved utility templates and adapt the send payloads before launch.
