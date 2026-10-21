/** Isolated local Supabase integration exercise. Never points at production. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.CAMP_TEST_SUPABASE_URL;
if (!url || !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(url)) {
  throw new Error("CAMP_TEST_SUPABASE_URL must be a local Supabase URL.");
}
for (const name of ["CAMP_TEST_SERVICE_ROLE_KEY", "CAMP_TEST_PUBLISHABLE_KEY", "CAMP_TEST_ADMIN_EMAIL", "CAMP_TEST_ADMIN_PASSWORD"]) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}
const service = createClient(url, process.env.CAMP_TEST_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const admin = createClient(url, process.env.CAMP_TEST_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const signIn = await admin.auth.signInWithPassword({ email: process.env.CAMP_TEST_ADMIN_EMAIL, password: process.env.CAMP_TEST_ADMIN_PASSWORD });
assert.ifError(signIn.error);

const dateAt = offset => {
  const day = new Date(); day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
};
const slugPrefix = `camp-test-${randomUUID().slice(0, 8)}`;
const config = (slug, day) => ({ title: `Integration Test ${slug}`, slug, description: "Disposable local integration test camp.",
  instructions: ["Arrive during your selected window."], venueName: "Local Test Hospital", venueAddress: "Test address",
  imageUrl: null, tokenPrefix: "TST", lifecycle: "published", registrationOpensAt: new Date(Date.now() - 3600000).toISOString(),
  registrationClosesAt: new Date(Date.now() + 2 * 86400000).toISOString(), datesReviewed: true,
  sessions: [{ date: day, startTime: "09:00", endTime: "11:00", active: true, slotDurationMinutes: 60,
    capacityPerSlot: 2, breaks: [], slots: [
      { startTime: "09:00", endTime: "10:00", capacity: 1, active: true },
      { startTime: "10:00", endTime: "11:00", capacity: 3, active: true },
    ] }] });
const save = async value => {
  const result = await admin.rpc("save_admin_camp", { p_config: value });
  assert.ifError(result.error); return result.data;
};
const firstId = await save(config(`${slugPrefix}-one`, dateAt(3)));
const secondConfig = config(`${slugPrefix}-two`, dateAt(4));
secondConfig.sessions[0].startTime = "13:00";
secondConfig.sessions[0].endTime = "15:00";
secondConfig.sessions[0].slots[0].startTime = "13:00";
secondConfig.sessions[0].slots[0].endTime = "14:00";
secondConfig.sessions[0].slots[1].startTime = "14:00";
secondConfig.sessions[0].slots[1].endTime = "15:00";
const secondId = await save(secondConfig);
const get = async id => {
  const result = await admin.rpc("get_admin_camp", { p_id: id });
  assert.ifError(result.error); return result.data;
};
const first = await get(firstId), second = await get(secondId);
assert.equal(first.tokenPrefix, "TST", "Admin-configured token place code is persisted");
assert.notEqual(first.sessions[0].date, second.sessions[0].date);
assert.notEqual(first.sessions[0].startTime, second.sessions[0].startTime);
assert.notEqual(first.sessions[0].id, second.sessions[0].id);
const [slotOne, slotTwo] = first.sessions[0].slots;
const phone = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`;
const book = (name, slot, key = randomUUID(), camp = first) => service.rpc("book_public_camp_slot", {
  p_slug: camp.slug, p_camp_id: camp.id, p_session_id: camp.sessions[0].id,
  p_slot_id: slot.id, p_name: name, p_mobile: phone, p_consent: true, p_submission_key: key,
});

const race = await Promise.all([book("Final Place A", slotOne), book("Final Place B", slotOne)]);
assert.equal(race.filter(x => !x.error).length, 1, "Only one of two final-place requests succeeds");
assert.equal(race.filter(x => x.error?.message === "SLOT_FULL").length, 1);
const winner = race.find(x => !x.error).data;
assert.match(winner.confirmation.token, /^TST-9AM-001$/, "New bookings receive a short slot token");
const sameKey = randomUUID();
const same = await Promise.all([book("Same Key Attendee", slotTwo, sameKey), book("Same Key Attendee", slotTwo, sameKey)]);
assert.equal(same.filter(x => !x.error).length, 2);
assert.equal(same[0].data.confirmation.bookingReference, same[1].data.confirmation.bookingReference);
const retry = await book("Same Key Attendee", slotTwo, sameKey);
assert.ifError(retry.error);
assert.deepEqual(retry.data, { status: "confirmed", confirmation: same[0].data.confirmation });
const conflict = await book("Changed Attendee", slotTwo, sameKey);
assert.equal(conflict.error?.message, "IDEMPOTENCY_CONFLICT");
const family = await book("Other Family Member", slotTwo);
assert.ifError(family.error);
const registrations = await service.from("camp_registrations").select("id,patient_id,participant_name,submission_key,token,registration_status,camp_slot_id")
  .eq("camp_id", firstId);
assert.ifError(registrations.error);
assert.equal(registrations.data.filter(x => x.submission_key === sameKey).length, 1);
assert.equal(new Set(registrations.data.map(x => x.patient_id)).size, 1, "Family shares contact record");
assert.equal(new Set(registrations.data.map(x => x.participant_name)).size, 3, "Attendees retain names");
const sameRegistration = registrations.data.find(x => x.submission_key === sameKey);
const jobs = await service.from("camp_notification_jobs").select("id").eq("registration_id", sameRegistration.id);
assert.ifError(jobs.error); assert.equal(jobs.data.length, 1, "Retries create one notification job");
const claimed = await service.rpc("claim_camp_notification_job", { p_job_id: jobs.data[0].id });
assert.ifError(claimed.error);
assert.equal(claimed.data?.bookingReference, same[0].data.confirmation.bookingReference);
const finishFailed = await service.rpc("finish_camp_notification_job", { p_job_id: jobs.data[0].id,
  p_sent: false, p_provider_id: null, p_error: "Local test failure" });
assert.ifError(finishFailed.error);
const afterRetryFailure = await service.from("camp_registrations").select("id").eq("submission_key", sameKey);
assert.equal(afterRetryFailure.data.length, 1, "Notification failure creates no extra booking");
const failedMove = await admin.rpc("change_admin_camp_registration", { p_registration_id: sameRegistration.id,
  p_action: "move", p_destination_slot: slotOne.id });
assert.ok(failedMove.error, "Move to full slot fails");
const afterFailedMove = await service.from("camp_registrations").select("camp_slot_id,token").eq("id", sameRegistration.id).single();
assert.equal(afterFailedMove.data.camp_slot_id, slotTwo.id);
const occupied = registrations.data.find(x => x.camp_slot_id === slotOne.id);
for (let i = 0; i < 2; i++) {
  const cancelled = await admin.rpc("change_admin_camp_registration", { p_registration_id: occupied.id,
    p_action: "cancel", p_destination_slot: null });
  assert.ifError(cancelled.error);
}
const availability = await service.rpc("get_public_camp", { p_slug: first.slug });
assert.ifError(availability.error);
assert.equal(availability.data.camp.sessions[0].slots[0].remaining, 1, "Repeated cancellation releases once");
const move = await admin.rpc("change_admin_camp_registration", { p_registration_id: sameRegistration.id,
  p_action: "move", p_destination_slot: slotOne.id });
assert.ifError(move.error);
const moved = await service.from("camp_registrations").select("camp_slot_id,token,booking_reference")
  .eq("id", sameRegistration.id).single();
assert.equal(moved.data.camp_slot_id, slotOne.id);
assert.notEqual(moved.data.token, afterFailedMove.data.token);
assert.equal(moved.data.booking_reference, same[0].data.confirmation.bookingReference);
const blockedReactivation = await admin.rpc("change_admin_camp_registration", { p_registration_id: occupied.id,
  p_action: "reactivate", p_destination_slot: null });
assert.ok(blockedReactivation.error, "Reactivation cannot overfill a slot");
const familyRow = registrations.data.find(x => x.participant_name === "Other Family Member");
assert.ifError((await admin.rpc("change_admin_camp_registration", { p_registration_id: familyRow.id,
  p_action: "cancel", p_destination_slot: null })).error);
assert.ifError((await admin.rpc("change_admin_camp_registration", { p_registration_id: familyRow.id,
  p_action: "reactivate", p_destination_slot: null })).error);
const reactivated = await service.from("camp_registrations").select("token,registration_status").eq("id", familyRow.id).single();
assert.equal(reactivated.data.registration_status, "Registered");
assert.notEqual(reactivated.data.token, familyRow.token, "Reactivation issues a fresh token");
const filtered = await admin.rpc("list_admin_camp_registrations", { p_camp_id: secondId, p_session_id: null,
  p_slot_id: null, p_registration_status: null, p_attendance_status: null, p_search: null, p_page: 1, p_size: 1 });
assert.ifError(filtered.error);
assert.equal(filtered.data.total, 0, "Camp filters isolate registrations");
const secondBooking = await book("Second Camp Attendee", second.sessions[0].slots[0], randomUUID(), second);
assert.ifError(secondBooking.error);
const secondFiltered = await admin.rpc("list_admin_camp_registrations", { p_camp_id: secondId, p_session_id: null,
  p_slot_id: null, p_registration_status: null, p_attendance_status: null, p_search: null, p_page: 1, p_size: 1 });
assert.equal(secondFiltered.data.total, 1);
assert.equal(secondFiltered.data.rows[0].camp_id, secondId);
const firstFiltered = await admin.rpc("list_admin_camp_registrations", { p_camp_id: firstId, p_session_id: null,
  p_slot_id: null, p_registration_status: null, p_attendance_status: null, p_search: null, p_page: 2, p_size: 1 });
assert.equal(firstFiltered.data.total, 3, "Total is independent of visible page");
assert.equal(firstFiltered.data.rows.length, 1);
assert.equal(firstFiltered.data.rows[0].camp_id, firstId);
const draft = await admin.rpc("save_admin_camp", { p_config: { ...config(`${slugPrefix}-draft`, dateAt(5)), lifecycle: "draft" } });
assert.ifError(draft.error);
const privateRead = await service.rpc("get_public_camp", { p_slug: `${slugPrefix}-draft` });
assert.equal(privateRead.data, null, "Draft camp is not public");
const cancelled = await admin.rpc("save_admin_camp", { p_config: { ...config(`${slugPrefix}-cancelled`, dateAt(5)), lifecycle: "cancelled" } });
assert.ifError(cancelled.error);
assert.equal((await service.rpc("get_public_camp", { p_slug: `${slugPrefix}-cancelled` })).data, null);
const pastPublish = await admin.rpc("save_admin_camp", { p_config: config(`${slugPrefix}-past`, dateAt(-2)) });
assert.ok(pastPublish.error, "Publishing a past session fails");
const mismatch = await book("Wrong Camp", second.sessions[0].slots[0], randomUUID(), first);
assert.ok(mismatch.error, "Camp/slot mismatch is rejected");
const close = await admin.rpc("close_admin_camp", { p_id: firstId });
assert.ifError(close.error);
const afterClose = await book("After Close", slotTwo);
assert.equal(afterClose.error?.message, "CAMP_NOT_FOUND", "Closed camp rejects new booking");
const replayAfterClose = await book("Same Key Attendee", slotTwo, sameKey);
assert.ifError(replayAfterClose.error);
assert.deepEqual(replayAfterClose.data.confirmation, same[0].data.confirmation,
  "Replay returns original confirmation after close and move");
const replayLookup = await service.rpc("replay_public_camp_booking", { p_slug: first.slug,
  p_camp_id: first.id, p_session_id: first.sessions[0].id, p_slot_id: slotTwo.id,
  p_name: "Same Key Attendee", p_mobile: phone, p_submission_key: sameKey });
assert.ifError(replayLookup.error);
assert.deepEqual(replayLookup.data.confirmation, same[0].data.confirmation);
if (process.env.CAMP_TEST_STAFF_EMAIL && process.env.CAMP_TEST_STAFF_PASSWORD) {
  const staff = createClient(url, process.env.CAMP_TEST_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const staffSignIn = await staff.auth.signInWithPassword({ email: process.env.CAMP_TEST_STAFF_EMAIL,
    password: process.env.CAMP_TEST_STAFF_PASSWORD });
  assert.ifError(staffSignIn.error);
  const denied = await staff.rpc("close_admin_camp", { p_id: secondId });
  assert.ok(denied.error, "Staff cannot close a camp");
}
console.log("PASS: concurrent final place, same-key concurrency/replay/conflict, family identity, cancellation, moves, private/closed camp, mismatch, outbox retry isolation, camp filtering, two admin-configured camps");
console.log("Local fixture camp IDs:", firstId, secondId);
