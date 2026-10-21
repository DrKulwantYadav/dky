# Reusable camp registration: Parts 2 and 3 integration contract

> Part 3 implements the endpoints described below. They fail closed until both reusable-camp migrations and server configuration are applied. See `docs/camps-backend.md` for the live-schema preflight, migration order, and notification setup. Statements below phrased as future work describe the original contract, not current code.

Part 1 renders `/camps` and `/camps/[slug]` against the shared types in `lib/camps/contracts.ts`. Placeholder handlers return HTTP 503 until the endpoints below are implemented; the pages show an error state and never claim a booking succeeded. The completed September 2026 page and its retired `/api/camp-registration` endpoint remain untouched.

All dates are `YYYY-MM-DD` and all local times are `HH:mm` in `Asia/Kolkata`. Public responses must contain no patient information. Disable caching or use suitably short invalidation for availability. Do not expose drafts or unpublished camps from any public endpoint; use 404 for an unknown or unpublished slug.

| Endpoint | Success body | Required behavior |
| --- | --- | --- |
| `GET /api/camps` | `CampListResponse` | Published, upcoming/current camps only, with server-derived `open`, `upcoming`, `closed`, or `full` status. Multiple camps are supported. |
| `GET /api/camps/:slug` | `CampDetailResponse` | Published camp and public sessions/slots only. Never include patient or admin data. |
| `GET /api/camps/:slug/availability` | `CampAvailabilityResponse` | Fresh remaining count and status per slot; exclude unpublished data. The public UI does not display the count. |
| `POST /api/camps/:slug/bookings` | `CampBookingSuccess` (`201`, or same confirmation for an idempotent replay) | Validate patient name, mobile, consent, camp, session and slot. Atomically check publication, registration status, slot capacity, time and duplicate submission key; issue a server token and confirmed booking immediately. |

Errors use `CampApiError` and appropriate HTTP status. In particular, return `SLOT_FULL` or `SLOT_CLOSED` with 409 so the form retains patient details and refreshes availability. For uncertain network/5xx responses the UI replays the same body and UUID `submissionKey` (also sent as `Idempotency-Key` header). Store a unique constraint on that key, bind it to the original payload, and return the original confirmation on replay. A different payload with the same key must return `IDEMPOTENCY_CONFLICT` with 409. A booking reference or token alone must never authorize access to patient details.

The existing `camps`, `camp_sessions`, and `camp_registrations` tables are the extension points. Part 2 adds the reusable camps admin migration, including slug, lifecycle, optional image, instructions, registration timing, arrival-window slots, token/reference fields and idempotency key. Part 3 must apply and verify that migration, then connect the public booking endpoints. Keep historical rows and pages intact. Admin authorization follows `requireAdmin`/`getAdmin` and existing Supabase RLS. The old public camp RPC is tied to the September 2026 camp and does not meet the new booking contract. The regular appointment endpoints remain independent.

After backend and admin work, verify a published camp appears in the list and at its copied slug URL; drafts/unknown slugs return no booking data; open, closed and full slots render correctly; one successful registration returns a server token and confirmed booking; repeat and timeout retries return the same booking; two people sharing one mobile create distinct attendees; concurrent requests cannot oversubscribe a slot. These are integration checks for Part 3.
