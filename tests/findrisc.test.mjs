import assert from "node:assert/strict";
import test from "node:test";
import { findriscAnswersSchema, scoreFindrisc } from "../lib/findrisc.ts";

const baseline = { age: "under45", heightCm: 180, weightKg: 70, waistSex: "man", waistCm: 80,
  activity: true, produceDaily: true, bloodPressureMedicine: false, highGlucose: false, family: "none" };

test("FINDRISC score ranges and clinical cutoffs", () => {
  assert.deepEqual([scoreFindrisc(baseline).total, scoreFindrisc(baseline).tier], [0, "low"]);
  assert.equal(scoreFindrisc({ ...baseline, age: "65plus", family: "extended" }).tier, "slightlyElevated");
  assert.equal(scoreFindrisc({ ...baseline, age: "65plus", family: "immediate", highGlucose: true }).tier, "moderate");
  assert.equal(scoreFindrisc({ ...baseline, age: "65plus", family: "immediate", highGlucose: true, activity: false }).tier, "high");
  assert.equal(scoreFindrisc({ ...baseline, age: "65plus", heightCm: 170, weightKg: 100, waistCm: 104,
    activity: false, produceDaily: false, bloodPressureMedicine: true, highGlucose: true, family: "immediate" }).tier, "veryHigh");
  assert.equal(scoreFindrisc({ ...baseline, heightCm: 200, weightKg: 100 }).points.bmi, 1); // BMI exactly 25
  assert.equal(scoreFindrisc({ ...baseline, waistCm: 94 }).points.waist, 3);
  assert.equal(scoreFindrisc({ ...baseline, waistSex: "woman", waistCm: 89 }).points.waist, 4);
});

test("invalid measurements and missing answers are rejected", () => {
  assert.equal(findriscAnswersSchema.safeParse({ ...baseline, heightCm: 0 }).success, false);
  assert.equal(findriscAnswersSchema.safeParse({ ...baseline, family: undefined }).success, false);
  assert.equal(findriscAnswersSchema.safeParse({ ...baseline, waistCm: 300 }).success, false);
});
