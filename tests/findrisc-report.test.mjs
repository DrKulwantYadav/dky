import assert from "node:assert/strict";
import test from "node:test";
import { renderFindriscReport } from "../lib/findrisc/report.ts";

test("named email report contains the saved score, next step and diagnostic caution", () => {
  const report = renderFindriscReport({ name: "Asha Rao", score: 16, tier: "high" });
  assert.equal(report.subject, "Your health assessment report");
  assert.match(report.text, /Hello Asha Rao,/);
  assert.match(report.text, /16 out of 26/);
  assert.match(report.text, /High risk/);
  assert.match(report.text, /not a diagnosis/);
  assert.match(report.text, /may not reflect your individual risk in India/);
  assert.doesNotMatch(report.html, /<img\b|connect\.facebook|google-analytics/i);
});

test("report escapes visitor name and rejects an invalid saved result", () => {
  const report = renderFindriscReport({ name: '<Asha & "Rao">', score: 6, tier: "low" });
  assert.match(report.html, /&lt;Asha &amp; &quot;Rao&quot;&gt;/);
  assert.doesNotMatch(report.html, /Hello <Asha/);
  assert.throws(() => renderFindriscReport({ name: "Asha", score: 27, tier: "low" }));
  assert.throws(() => renderFindriscReport({ name: "Asha", score: 5, tier: "unknown" }));
});
