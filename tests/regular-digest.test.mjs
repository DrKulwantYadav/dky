import test from "node:test";
import assert from "node:assert/strict";
import { indiaDates, renderRegularDigest } from "../lib/regular-digest.ts";

test("IST calendar boundaries include the correct today and tomorrow", () => {
  assert.deepEqual(indiaDates(new Date("2026-11-09T18:29:59Z")), { today: "2026-11-09", tomorrow: "2026-11-10" });
  assert.deepEqual(indiaDates(new Date("2026-11-09T18:30:00Z")), { today: "2026-11-10", tomorrow: "2026-11-11" });
  assert.deepEqual(indiaDates(new Date("2026-12-31T18:30:00Z")), { today: "2027-01-01", tomorrow: "2027-01-02" });
});

test("both empty sections still produce a useful staff email", () => {
  const report = renderRegularDigest({ date: "2026-11-09", cutoffAt: "2026-11-09T16:30:00Z", todayRequests: [], tomorrowRequests: [] });
  assert.match(report.text, /No regular appointment requests received today/);
  assert.match(report.text, /No requests listed for tomorrow/);
  assert.match(report.text, /Snapshot:/);
  assert.match(report.html, /No requests listed for tomorrow/);
});

test("status, confirmation, and cancellations are explicit without medical reason", () => {
  const cancelled = { name: "Asha <script>", phone: "9876543210", preferredDate: "2026-11-10",
    preferredTime: "17:30:00", preferredTimeWindow: null, registrationStatus: "Cancelled", confirmationStatus: "Pending" };
  const report = renderRegularDigest({ date: "2026-11-09", cutoffAt: "2026-11-09T16:30:00Z",
    todayRequests: [cancelled], tomorrowRequests: [cancelled] });
  assert.match(report.text, /CANCELLED — do not expect/);
  assert.match(report.text, /Confirmation: Pending/);
  assert.match(report.html, /Asha &lt;script&gt;/);
  assert.doesNotMatch(report.html, /<script>/);
  assert.match(report.text, /5:30 pm IST/);
});

test("tomorrow's no-shows are flagged even when no request arrived today", () => {
  const report = renderRegularDigest({ date: "2026-11-09", cutoffAt: "2026-11-09T16:30:00Z",
    todayRequests: [], tomorrowRequests: [{ name: "Ravi", phone: "9876543210", preferredDate: "2026-11-10",
      preferredTime: null, preferredTimeWindow: "Morning", registrationStatus: "No-show", confirmationStatus: "Confirmed" }] });
  assert.match(report.text, /No regular appointment requests received today/);
  assert.match(report.text, /NO-SHOW — do not expect/);
  assert.match(report.html, /NO-SHOW — do not expect/);
});
