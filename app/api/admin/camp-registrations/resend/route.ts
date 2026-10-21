import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { queueCampNotification } from "@/lib/camps/notifications";

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return NextResponse.json({ error: "Administrator permission required." }, { status: 403 });
  const parsed = z.object({ id: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid registration." }, { status: 400 });
  const db = await createClient();
  const { data, error } = await db.rpc("resend_admin_camp_confirmation", { p_registration_id: parsed.data.id });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0001" ? 429 : 400 });
  if (typeof data === "string") await queueCampNotification(data).catch(() => {});
  return NextResponse.json({ queued: true });
}
