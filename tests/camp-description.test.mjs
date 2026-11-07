import assert from "node:assert/strict";
import test from "node:test";
import { parseCampDescription } from "../lib/camps/description.ts";

test("legacy camp description keeps its introduction and services", () => {
  const blocks = parseCampDescription("A free community camp. Free Services & Screenings Offered: FibroScan, consultation and advice.");
  assert.deepEqual(blocks, [
    { type: "highlight", text: "A free community camp." },
    { type: "paragraph", text: "Free services & screenings offered" },
    { type: "list", items: ["FibroScan", "consultation", "advice"] },
  ]);
});

test("explicit paragraphs, highlights and bullet lists render in order", () => {
  const blocks = parseCampDescription("First paragraph.\nSecond line.\n\n! Important arrival note\n- Screening\n- Consultation\n\nFinal paragraph.");
  assert.deepEqual(blocks, [
    { type: "paragraph", text: "First paragraph. Second line." },
    { type: "highlight", text: "Important arrival note" },
    { type: "list", items: ["Screening", "Consultation"] },
    { type: "paragraph", text: "Final paragraph." },
  ]);
});
