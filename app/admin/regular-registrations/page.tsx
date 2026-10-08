import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RegistrationActions } from "@/components/admin/RegistrationActions";
import { Empty, PageHead, Pagination } from "../free-camp-registrations/page";
import { slotLabel } from "@/lib/appointment-slots";

type RegularRow = {
  id: string; requester_name?: string | null; requester_email?: string | null; age_group?: string | null;
  patient_type?: string | null; preferred_time_window?: string | null; consultation_type: string;
  fee_inr?: number | null;
  preferred_date: string | null; preferred_time: string | null; reason_for_visit: string | null;
  source: string; registration_status: string; confirmation_status: string; created_at: string;
  patients: { full_name: string; phone: string; city: string | null; area: string | null } | null;
};

export default async function RegularPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const filters = await searchParams;
  const page = Math.max(1, Number(filters.page) || 1);
  const size = 20;
  const supabase = await createClient();
  const load = (level: 0 | 1 | 2) => {
    const detailFields = level > 0 ? "requester_name,requester_email,age_group,patient_type,preferred_time_window," : "";
    const slotFields = level === 2 ? "fee_inr," : "";
    const fields: string = `id,${detailFields}${slotFields}consultation_type,preferred_date,preferred_time,reason_for_visit,source,registration_status,confirmation_status,created_at,patients(full_name,phone,city,area)`;
    let query = supabase.from("regular_registrations")
      .select(fields, { count: "exact" })
      .order("created_at", { ascending: false }).range((page - 1) * size, page * size - 1);
    if (filters.status) query = query.eq("registration_status", filters.status);
    if (filters.confirmation) query = query.eq("confirmation_status", filters.confirmation);
    return query;
  };
  let result = await load(2);
  if (result.error?.code === "42703" || result.error?.code === "PGRST204") result = await load(1);
  if (result.error?.code === "42703" || result.error?.code === "PGRST204") result = await load(0);
  const { data, count, error } = result;
  const rows = ((data || []) as unknown as RegularRow[]).filter(row => !filters.q ||
    `${row.requester_name || row.patients?.full_name} ${row.patients?.phone} ${row.id}`.toLowerCase().includes(filters.q.toLowerCase()));

  return <>
    <PageHead title="Regular registrations" subtitle="Appointment requests, consultations and follow-ups." exportType="regular"/>
    <form className="admin-filters"><input name="q" placeholder="Search name, phone or ID" defaultValue={filters.q || ""}/><select name="status" defaultValue={filters.status || ""}><option value="">All statuses</option>{["New", "Contacted", "Confirmed", "Appointment Booked", "Completed", "Cancelled", "No-show"].map(status => <option key={status}>{status}</option>)}</select><select name="confirmation" defaultValue={filters.confirmation || ""}><option value="">All confirmations</option><option>Pending</option><option>Confirmed</option><option>Rejected</option></select><button>Apply filters</button><Link href="/admin/regular-registrations">Clear filters</Link></form>
    <div className="admin-table-wrap">{error ? <Empty text="Could not load appointment requests."/> : rows.length === 0 ? <Empty text="No regular registrations match these filters."/> : <table className="admin-table"><thead><tr><th>Patient</th><th>Phone</th><th>Consultation</th><th>Preferred date / time</th><th>Fee</th><th>Source</th><th>Status</th><th>Confirmation</th><th>Created</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.requester_name || row.patients?.full_name}</strong><small>{[row.patient_type, row.age_group, row.requester_email].filter(Boolean).join(" · ") || row.patients?.area || row.patients?.city}</small></td><td>{row.patients?.phone}</td><td>{row.consultation_type}<small>{row.reason_for_visit || "—"}</small></td><td>{row.preferred_date ? new Date(`${row.preferred_date}T12:00:00Z`).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" }) : "—"}<small>{row.preferred_time_window || (row.preferred_time ? slotLabel(row.preferred_time) : "—")}</small></td><td>{row.fee_inr ? `₹${row.fee_inr}` : "—"}</td><td>{row.source}</td><td><StatusBadge value={row.registration_status}/></td><td><StatusBadge value={row.confirmation_status}/></td><td>{new Date(row.created_at).toLocaleDateString("en-IN")}</td><td><RegistrationActions id={row.id} type="regular"/></td></tr>)}</tbody></table>}</div>
    <Pagination page={page} pages={Math.max(1, Math.ceil((count || 0) / size))}/>
  </>;
}
