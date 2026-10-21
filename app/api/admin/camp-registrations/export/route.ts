import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { campRegistrationFilterSchema } from "../search/route";

function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
type ExportRow = { participant_name: string | null; full_name: string; phone: string; camp_name: string; session_date: string | null;
  start_time: string | null; end_time: string | null; token: string | null; booking_reference: string | null;
  registration_status: string; attendance_status: string; confirmation_status: string; notification_status: string; created_at: string };

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const parsed = campRegistrationFilterSchema.omit({ page: true, size: true }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("Invalid filters", { status: 400 });
  const filters = parsed.data;
  const supabase = await createClient();
  const rows: ExportRow[] = [];
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabase.rpc("list_admin_camp_registrations", {
      p_camp_id: filters.campId, p_session_id: filters.sessionId, p_slot_id: filters.slotId,
      p_registration_status: filters.registrationStatus, p_attendance_status: filters.attendanceStatus,
      p_search: filters.search, p_page: page, p_size: 100,
    });
    if (error) return new Response("Export requires the reusable camps migration", { status: 503 });
    const batch = (data?.rows || []) as ExportRow[];
    rows.push(...batch);
    if (rows.length >= Number(data?.total || 0)) break;
    if (page === 100) return new Response("Too many rows to export at once; narrow the filters.", { status: 413 });
  }
  const headers = ["Attendee", "Mobile", "Camp", "Session date", "Arrival start", "Arrival end", "Token", "Booking reference", "Registration", "Attendance", "Confirmation", "Notification", "Created at"];
  const lines = rows.map(row => [row.participant_name || row.full_name, row.phone, row.camp_name, row.session_date, row.start_time, row.end_time,
    row.token, row.booking_reference, row.registration_status, row.attendance_status, row.confirmation_status, row.notification_status, row.created_at]);
  await supabase.from("admin_activity_logs").insert({ admin_id: admin.user.id, action: "CSV exported", metadata: { type: "camp", rows: rows.length, filtered: true } });
  return new Response([headers, ...lines].map(line => line.map(csvCell).join(",")).join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=camp-registrations.csv", "Cache-Control": "no-store" } });
}
