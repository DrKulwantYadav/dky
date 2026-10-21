import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export const campRegistrationFilterSchema = z.object({ campId: z.uuid().nullable(), sessionId: z.uuid().nullable(), slotId: z.uuid().nullable(),
  registrationStatus: z.enum(["New","Registered","Cancelled"]).nullable(), attendanceStatus: z.enum(["Pending","Attended","No-show","Cancelled"]).nullable(),
  search: z.string().max(120), page: z.number().int().min(1), size: z.number().int().min(1).max(100) });

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = campRegistrationFilterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid registration filters." }, { status: 400 });
  const values = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_admin_camp_registrations", {
    p_camp_id: values.campId, p_session_id: values.sessionId, p_slot_id: values.slotId,
    p_registration_status: values.registrationStatus, p_attendance_status: values.attendanceStatus,
    p_search: values.search, p_page: values.page, p_size: values.size,
  });
  if (error) return NextResponse.json({ error: error.code === "42883" ? "Camp administration migration is not applied." : "Registrations could not be loaded." }, { status: 503 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
