import { NextResponse } from "next/server";
import type { CampListResponse } from "@/lib/camps/contracts";
import { campDatabase, campError, noStore } from "@/lib/camps/server";

export async function GET() {
  const db = campDatabase();
  if (!db) return campError("SERVICE_UNAVAILABLE", 503, "Camp listing is unavailable.");
  const { data, error } = await db.rpc("list_public_camps");
  if (error || !Array.isArray(data)) return campError("SERVICE_UNAVAILABLE", 503, "Camp listing is unavailable.");
  return NextResponse.json<CampListResponse>({ camps: data }, { headers: noStore });
}
