import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import AppointmentSlotManager, { type AdminSlot } from "@/components/admin/AppointmentSlotManager";
import { PageHead } from "../free-camp-registrations/page";
import "./slots.css";

export const dynamic = "force-dynamic";

type Search = { from?: string; to?: string };
const validDate = (value: string | undefined) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
function defaultDateRange() {
  const nowIndia = new Date(Date.now() + 330 * 60_000);
  return { today: nowIndia.toISOString().slice(0, 10), monthEnd: new Date(nowIndia.getTime() + 30 * 86_400_000).toISOString().slice(0, 10) };
}

export default async function AppointmentSlotsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const { today, monthEnd } = defaultDateRange();
  const fromDate = validDate(params.from) ? params.from! : today;
  const toDate = validDate(params.to) ? params.to! : monthEnd;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_admin_appointment_slots", { p_from: fromDate, p_to: toDate });
  const slots = (data || []) as AdminSlot[];

  return <>
    <PageHead title="Appointment slots" subtitle="Open Dr. Yadav’s sitting hours in India Standard Time. Patients only see times that can still be booked."/>
    <form className="admin-filters slot-view-filter"><label>Show from<input type="date" name="from" defaultValue={fromDate}/></label><label>Show to<input type="date" name="to" defaultValue={toDate}/></label><button type="submit">Show slots</button><Link href="/admin/appointment-slots">Next 31 days</Link></form>
    {error ? <div className="admin-alert error">Appointment slots could not be loaded. Apply the appointment slot migration and try again.</div> : <AppointmentSlotManager slots={slots} fromDate={fromDate} toDate={toDate} canManage={admin.profile.role !== "staff"}/>}
  </>;
}
