import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

type ExportPatient = { full_name: string; phone: string; age: number | null; gender: string | null; area: string | null; city: string | null } | null;
type RegularExportRow = {
  requester_name?: string | null; requester_email?: string | null; age_group?: string | null; patient_type?: string | null;
  consultation_type: string; reason_for_visit: string | null; preferred_date: string | null;
  preferred_time_window?: string | null; preferred_time: string | null; registration_status: string;
  fee_inr?: number | null;
  confirmation_status: string; source: string; created_at: string; patients: ExportPatient;
};
type CampExportRow = {
  participant_name?: string | null; participant_age?: number | null; confirmation_status: string;
  reminder_status: string; attendance_status: string; source: string; created_at: string;
  patients: ExportPatient; camps: { name: string } | null; camp_sessions: { session_date: string } | null;
};

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const type = new URL(request.url).searchParams.get("type");
  const supabase = await createClient();
  let headers: string[];
  let rows: unknown[][];

  if (type === "regular") {
    const load = (level: 0 | 1 | 2) => {
      const fields: string = `id,${level > 0 ? "requester_name,requester_email,age_group,patient_type,preferred_time_window," : ""}${level === 2 ? "fee_inr," : ""}consultation_type,preferred_date,preferred_time,reason_for_visit,registration_status,confirmation_status,source,created_at,patients(full_name,phone,age,gender,area,city)`;
      return supabase.from("regular_registrations").select(fields).order("created_at", { ascending: false });
    };
    let result = await load(2);
    if (result.error?.code === "42703" || result.error?.code === "PGRST204") result = await load(1);
    if (result.error?.code === "42703" || result.error?.code === "PGRST204") result = await load(0);
    if (result.error) return new Response("Could not export appointment requests", { status: 500 });
    headers = ["Name", "Phone", "Email", "Age Group", "Patient Type", "Area", "City", "Consultation", "Reason", "Preferred Date", "Preferred Time", "Fee (INR)", "Status", "Confirmation", "Source", "Registration Date"];
    rows = ((result.data || []) as unknown as RegularExportRow[]).map(row => [row.requester_name || row.patients?.full_name, row.patients?.phone, row.requester_email, row.age_group, row.patient_type, row.patients?.area, row.patients?.city, row.consultation_type, row.reason_for_visit, row.preferred_date, row.preferred_time_window || row.preferred_time, row.fee_inr, row.registration_status, row.confirmation_status, row.source, row.created_at]);
  } else {
    const load = (withParticipantDetails: boolean) => supabase.from("camp_registrations")
      .select(`id,${withParticipantDetails ? "participant_name,participant_age," : ""}confirmation_status,reminder_status,attendance_status,source,created_at,patients(full_name,phone,age,gender,area,city),camps(name),camp_sessions(session_date)`)
      .order("created_at", { ascending: false });
    let result = await load(true);
    if (result.error?.code === "42703" || result.error?.code === "PGRST204") result = await load(false);
    if (result.error) return new Response("Could not export registrations", { status: 500 });
    headers = ["Name", "Phone", "Age", "Gender", "Area", "City", "Camp", "Session", "Confirmation", "Reminder", "Attendance", "Source", "Registration Date"];
    rows = ((result.data || []) as unknown as CampExportRow[]).map(row => [row.participant_name || row.patients?.full_name, row.patients?.phone, row.participant_age || row.patients?.age, row.patients?.gender, row.patients?.area, row.patients?.city, row.camps?.name, row.camp_sessions?.session_date, row.confirmation_status, row.reminder_status, row.attendance_status, row.source, row.created_at]);
  }

  await supabase.from("admin_activity_logs").insert({ admin_id: admin.user.id, action: "CSV exported", metadata: { type: type || "camp", rows: rows.length } });
  const body = [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\n");
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename=${type || "camp"}-registrations.csv` } });
}
