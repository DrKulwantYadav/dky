import { z } from "zod";

export const findriscAnswersSchema = z.object({
  age: z.enum(["under45", "45to54", "55to64", "65plus"]),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(25).max(350),
  waistSex: z.enum(["man", "woman"]),
  waistCm: z.number().min(50).max(200),
  activity: z.boolean(),
  produceDaily: z.boolean(),
  bloodPressureMedicine: z.boolean(),
  highGlucose: z.boolean(),
  family: z.enum(["none", "extended", "immediate"]),
}).strict();

export type FindriscAnswers = z.infer<typeof findriscAnswersSchema>;

export function scoreFindrisc(a: FindriscAnswers) {
  const bmi = a.weightKg / (a.heightCm / 100) ** 2;
  const bmiPoints = bmi < 25 ? 0 : bmi < 30 ? 1 : 3;
  const waistPoints = a.waistSex === "man"
    ? a.waistCm < 94 ? 0 : a.waistCm <= 102 ? 3 : 4
    : a.waistCm < 80 ? 0 : a.waistCm <= 88 ? 3 : 4;
  const points = { age: { under45: 0, "45to54": 2, "55to64": 3, "65plus": 4 }[a.age], bmi: bmiPoints,
    waist: waistPoints, activity: a.activity ? 0 : 2, produce: a.produceDaily ? 0 : 1,
    bloodPressureMedicine: a.bloodPressureMedicine ? 2 : 0, highGlucose: a.highGlucose ? 5 : 0,
    family: { none: 0, extended: 3, immediate: 5 }[a.family] };
  const total = Object.values(points).reduce((sum, value) => sum + value, 0);
  const tier = total < 7 ? "low" : total < 12 ? "slightlyElevated" : total < 15 ? "moderate" : total < 21 ? "high" : "veryHigh";
  return { bmi: Math.round(bmi * 10) / 10, points, total, tier } as const;
}
