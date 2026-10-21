import { z } from "zod";
import type { AdminCampConfig } from "./contracts";
import { validateCampConfig } from "./admin-validation";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const slot = z.object({ id: z.uuid().optional(), startTime: time, endTime: time, capacity: z.number().int().min(1).max(10000), active: z.boolean(), bookedCount: z.number().int().min(0).optional() });
const session = z.object({ id: z.uuid().optional(), date: z.iso.date(), startTime: time, endTime: time,
  active: z.boolean(), slotDurationMinutes: z.number().int().min(5).max(240), capacityPerSlot: z.number().int().min(1).max(10000),
  breaks: z.array(z.object({ startTime: time, endTime: time })).max(20), slots: z.array(slot).max(200) });
export const campConfigSchema = z.object({ id: z.uuid().optional(), title: z.string().max(160), slug: z.string().max(100),
  description: z.string().max(2000), instructions: z.array(z.string().max(1000)).max(30), venueName: z.string().max(200),
  venueAddress: z.string().max(1000), imageUrl: z.union([z.url(), z.null()]), tokenPrefix: z.string().regex(/^$|^[A-Z]{3}$/), lifecycle: z.enum(["draft","published","closed","cancelled"]),
  registrationOpensAt: z.union([z.iso.datetime({ offset: true }), z.null()]), registrationClosesAt: z.union([z.iso.datetime({ offset: true }), z.null()]),
  datesReviewed: z.boolean(), sessions: z.array(session).min(1).max(50),
});

export function parseAdminCamp(input: unknown): { config?: AdminCampConfig; errors: string[] } {
  const parsed = campConfigSchema.safeParse(input);
  if (!parsed.success) return { errors: ["Check all camp fields, session dates and slot settings."] };
  const config = parsed.data as AdminCampConfig;
  const errors = validateCampConfig(config);
  return errors.length ? { errors } : { config, errors: [] };
}
