import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

// Legacy confirmation/reminder metadata updates remain available. Capacity-changing
// actions use the transactional /action endpoint and cannot bypass its audit trail.
const schema = z.object({ id: z.uuid(), confirmation_status: z.enum(["Pending","Confirmed","Rejected"]).optional(),
  reminder_status: z.enum(["Not Scheduled","Scheduled","Sent","Failed","Cancelled"]).optional() }).refine(value => !!value.confirmation_status || !!value.reminder_status);

export async function PATCH(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return NextResponse.json({ error: "Administrator permission required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Use the camp registration actions for attendance or cancellation." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_admin_camp_registration_metadata", {
    p_id: parsed.data.id, p_confirmation: parsed.data.confirmation_status || null, p_reminder: parsed.data.reminder_status || null });
  if (error) return NextResponse.json({ error: "Registration metadata could not be updated." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
