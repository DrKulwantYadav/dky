import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ id: z.uuid(), action: z.enum(["attend","no_show","cancel","move","reactivate"]), destinationSlotId: z.uuid().nullable() });

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return NextResponse.json({ error: "Administrator permission required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.action === "move" && !parsed.data.destinationSlotId)) return NextResponse.json({ error: "Invalid registration action." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_admin_camp_registration", { p_registration_id: parsed.data.id, p_action: parsed.data.action, p_destination_slot: parsed.data.destinationSlotId });
  if (error) return NextResponse.json({ error: error.code === "42883" ? "Camp administration migration is not applied." : error.message }, { status: error.code === "42883" ? 503 : 400 });
  return NextResponse.json({ ok: true });
}
