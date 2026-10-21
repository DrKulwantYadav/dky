import { NextResponse } from "next/server";
import type { CampDetailResponse } from "@/lib/camps/contracts";
import { campDatabase, campError, noStore } from "@/lib/camps/server";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return campError("CAMP_NOT_FOUND", 404, "Camp not found.");
  const db = campDatabase();
  if (!db) return campError("SERVICE_UNAVAILABLE", 503, "Camp details are unavailable.");
  const { data, error } = await db.rpc("get_public_camp", { p_slug: slug });
  if (error) return campError("SERVICE_UNAVAILABLE", 503, "Camp details are unavailable.");
  if (!data?.camp) return campError("CAMP_NOT_FOUND", 404, "Camp not found.");
  return NextResponse.json<CampDetailResponse>(data, { headers: noStore });
}
