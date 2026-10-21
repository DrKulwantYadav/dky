import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";
import type { CampApiError, CampApiErrorCode } from "./contracts";

export function campDatabase() {
  try { return createSupabaseAdmin(); } catch { return null; }
}
export function campError(code: CampApiErrorCode, status: number, message: string) {
  return NextResponse.json<CampApiError>({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}
export function publicCampFailure(error: { message?: string; code?: string } | null) {
  const code = error?.message as CampApiErrorCode | undefined;
  const known: Record<string, [number, string]> = {
    VALIDATION_ERROR: [400, "Check the registration details and consent."],
    CAMP_NOT_FOUND: [404, "This camp is not available for registration."],
    REGISTRATION_CLOSED: [409, "Registration is not open for this camp."],
    SLOT_CLOSED: [409, "This arrival window is no longer available."],
    SLOT_FULL: [409, "This arrival window is full. Choose another window."],
    IDEMPOTENCY_CONFLICT: [409, "This submission key belongs to different booking details. Start a new booking."],
  };
  if (code && known[code]) return campError(code, ...known[code]);
  return campError("SERVICE_UNAVAILABLE", 503, "Camp registration is temporarily unavailable. Please retry safely.");
}
export function rateHash(value: string) {
  const secret = process.env.CAMP_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}
export const noStore = { "Cache-Control": "no-store" };
