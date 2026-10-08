import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { minutesToTime, timeToMinutes } from "@/lib/appointment-slots";

const openSchema = z.object({
  startDate: z.iso.date(), endDate: z.iso.date(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  from: z.string().regex(/^\d{2}:\d{2}$/),
  to: z.string().regex(/^\d{2}:\d{2}$/),
});
const updateSchema = z.object({ ids: z.array(z.uuid()).min(1).max(100), isOpen: z.boolean() });

function adminCanManage(role: string) { return role === "admin" || role === "super_admin"; }

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminCanManage(admin.profile.role)) return NextResponse.json({ error: "Only an administrator can open appointment slots." }, { status: 403 });
  const parsed = openSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the dates, weekdays and times." }, { status: 400 });

  const values = parsed.data;
  const start = Date.parse(`${values.startDate}T00:00:00Z`);
  const end = Date.parse(`${values.endDate}T00:00:00Z`);
  const from = timeToMinutes(values.from);
  const to = timeToMinutes(values.to);
  const todayIndia = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end - start > 30 * 86_400_000 ||
      values.startDate < todayIndia || from < 480 || to > 1320 || to <= from || from % 30 !== 0 || to % 30 !== 0) {
    return NextResponse.json({ error: "Use a future date range of up to 31 days, between 8:00 am and 10:00 pm, on half-hour boundaries." }, { status: 400 });
  }

  const days = new Set(values.weekdays);
  const rows: { slot_date: string; start_time: string; is_open: boolean; created_by: string }[] = [];
  for (let day = start; day <= end; day += 86_400_000) {
    const date = new Date(day);
    if (!days.has(date.getUTCDay())) continue;
    for (let minutes = from; minutes < to; minutes += 30) {
      rows.push({ slot_date: date.toISOString().slice(0, 10), start_time: minutesToTime(minutes), is_open: true, created_by: admin.user.id });
    }
  }
  if (!rows.length) return NextResponse.json({ error: "No dates in this range match the selected weekdays." }, { status: 400 });

  const supabase = await createClient();
  for (let offset = 0; offset < rows.length; offset += 100) {
    const { error } = await supabase.from("appointment_slots").upsert(rows.slice(offset, offset + 100), { onConflict: "slot_date,start_time" });
    if (error) {
      console.error("Opening appointment slots failed", error.code);
      return NextResponse.json({ error: "Slots could not all be opened. Please retry; already opened slots will not be duplicated." }, { status: 503 });
    }
  }
  return NextResponse.json({ ok: true, opened: rows.length });
}

export async function PATCH(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminCanManage(admin.profile.role)) return NextResponse.json({ error: "Only an administrator can change appointment slots." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid slot update." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("appointment_slots").update({ is_open: parsed.data.isOpen }).in("id", parsed.data.ids);
  if (error) {
    console.error("Appointment slot update failed", error.code);
    return NextResponse.json({ error: "The slot could not be updated. Please try again." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
