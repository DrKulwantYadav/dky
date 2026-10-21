import { NextResponse } from "next/server";
import type { CampApiError } from "./contracts";

/** Replaced by the real camp API in Parts 2/3. Never return a synthetic booking. */
export function campServiceUnavailable() {
  return NextResponse.json<CampApiError>({ error: { code: "SERVICE_UNAVAILABLE", message: "Camp registration is not available yet." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
