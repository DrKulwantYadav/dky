import { NextResponse } from "next/server";
import { z } from "zod";
import type { CampBookingSuccess } from "@/lib/camps/contracts";
import { campDatabase, campError, noStore, publicCampFailure, rateHash } from "@/lib/camps/server";
import { queueCampNotification } from "@/lib/camps/notifications";

export const runtime = "nodejs";
const schema = z.object({ campId: z.uuid(), sessionId: z.uuid(), slotId: z.uuid(),
  patientName: z.string().trim().min(2).max(120), mobile: z.string().trim().min(10).max(20)
    .refine(value => /^(?:\+?91[- ]?)?[6-9]\d{9}$/.test(value)),
  consent: z.literal(true), submissionKey: z.uuid() }).strict();

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return campError("CAMP_NOT_FOUND", 404, "Camp not found.");
  if (Number(request.headers.get("content-length") || 0) > 4000) return campError("VALIDATION_ERROR", 413, "Request is too large.");
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return campError("VALIDATION_ERROR", 403, "Invalid request origin.");
  const body = await request.text();
  if (Buffer.byteLength(body) > 4000) return campError("VALIDATION_ERROR", 413, "Request is too large.");
  let raw: unknown;
  try { raw = JSON.parse(body); } catch { return campError("VALIDATION_ERROR", 400, "Invalid booking details."); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success || request.headers.get("Idempotency-Key") !== parsed.data.submissionKey)
    return campError("VALIDATION_ERROR", 400, "Invalid booking details or submission key.");
  const db = campDatabase();
  if (!db) return campError("SERVICE_UNAVAILABLE", 503, "Registration is temporarily unavailable.");
  const mobile = parsed.data.mobile.replace(/\D/g, "").slice(-10);
  const values = { p_slug: slug, p_camp_id: parsed.data.campId, p_session_id: parsed.data.sessionId,
    p_slot_id: parsed.data.slotId, p_name: parsed.data.patientName, p_mobile: mobile,
    p_submission_key: parsed.data.submissionKey };
  const replay = await db.rpc("replay_public_camp_booking", values);
  if (replay.error) return publicCampFailure(replay.error);
  if (replay.data?.confirmation) return NextResponse.json<CampBookingSuccess>(replay.data, { headers: noStore });
  const readiness = await db.rpc("camp_token_format_ready");
  if (readiness.error || readiness.data !== true) return campError("SERVICE_UNAVAILABLE", 503, "Camp registration is temporarily unavailable.");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const phoneHash = rateHash(`phone:${mobile}`), ipHash = rateHash(`ip:${ip}`);
  if (!phoneHash || !ipHash) return campError("SERVICE_UNAVAILABLE", 503, "Registration is temporarily unavailable.");
  for (const [key, limit] of [[phoneHash, 30], [ipHash, 100]] as const) {
    const { data: allowed, error } = await db.rpc("consume_camp_rate_limit", { p_key_hash: key, p_limit: limit, p_window_seconds: 3600 });
    if (error) return campError("SERVICE_UNAVAILABLE", 503, "Registration is temporarily unavailable.");
    if (!allowed) return campError("RATE_LIMITED", 429, "Too many attempts. Please try again later.");
  }
  const { data, error } = await db.rpc("book_public_camp_slot", { ...values, p_consent: true });
  if (error) return publicCampFailure(error);
  if (!data?.confirmation) return campError("SERVICE_UNAVAILABLE", 503, "Booking result is uncertain. Retry with the same details and key.");
  if (typeof data.jobId === "string") await queueCampNotification(data.jobId).catch(() => {});
  return NextResponse.json<CampBookingSuccess>({ status: "confirmed", confirmation: data.confirmation }, { headers: noStore });
}
