import test from "node:test";
import assert from "node:assert/strict";
import { renderPatientReminder } from "../lib/regular-patient-reminder.ts";

test("patient reminder asks for reception check-in and leaves booking unchanged", () => {
  const message = renderPatientReminder({ recipientName: "Asha", appointmentDate: "2026-11-12",
    appointmentTime: "10:00:00", appointmentTimeWindow: null });
  assert.match(message.subject, /clinic visit tomorrow/);
  assert.match(message.text, /12 November 2026/);
  assert.match(message.text, /10:00 AM – 10:30 AM/);
  assert.match(message.text, /check in with reception/);
  assert.match(message.text, /does not change your booking/);
  assert.doesNotMatch(message.text, /diabetes|payment|medical reason/i);
});

test("patient-provided names are escaped in HTML", () => {
  const message = renderPatientReminder({ recipientName: "Asha <script>", appointmentDate: "2026-11-12",
    appointmentTime: null, appointmentTimeWindow: "Morning" });
  assert.match(message.html, /Asha &lt;script&gt;/);
  assert.doesNotMatch(message.html, /<script>/);
  assert.match(message.text, /Morning IST/);
});
