import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

export default async function DashboardPage() {
  await requireAdmin();
  const supabase = await createClient();
  const kolkata = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const start = `${kolkata}T00:00:00+05:30`, end = `${kolkata}T23:59:59+05:30`;
  const [camp, regular, todayCamp, todayRegular, confirmed, pending, attended, noShow, reminderPending, reminderSent, campRows, sessionRows] = await Promise.all([
    supabase.from("camp_registrations").select("*", { count: "exact", head: true }),
    supabase.from("regular_registrations").select("*", { count: "exact", head: true }),
    supabase.from("camp_registrations").select("*", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    supabase.from("regular_registrations").select("*", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    supabase.from("camp_registrations").select("*", { count: "exact", head: true }).eq("confirmation_status", "Confirmed"),
    supabase.from("camp_registrations").select("*", { count: "exact", head: true }).eq("confirmation_status", "Pending"),
    supabase.from("camp_registrations").select("*", { count: "exact", head: true }).eq("attendance_status", "Attended"),
    supabase.from("camp_registrations").select("*", { count: "exact", head: true }).eq("attendance_status", "No-show"),
    supabase.from("camp_registrations").select("*", { count: "exact", head: true }).in("reminder_status", ["Not Scheduled", "Scheduled"]),
    supabase.from("camp_registrations").select("*", { count: "exact", head: true }).eq("reminder_status", "Sent"),
    supabase.from("camp_registrations").select("created_at, source, attendance_status, camp_session_id"),
    supabase.from("camp_sessions").select("id, session_date").order("session_date"),
  ]);
  const totalCamp=camp.count||0, totalRegular=regular.count||0;
  const cards = [
    ["Total registrations", totalCamp+totalRegular], ["Today's registrations", (todayCamp.count||0)+(todayRegular.count||0)],
    ["Regular registrations", totalRegular], ["Free camp registrations", totalCamp], ["Confirmed patients", confirmed.count||0],
    ["Pending confirmations", pending.count||0], ["Attended", attended.count||0], ["No-show", noShow.count||0],
    ["Reminder pending", reminderPending.count||0], ["Reminder sent", reminderSent.count||0],
  ];
  const rows = campRows.data || [];
  const dayMap = new Map<string, number>(); rows.forEach((r) => { const d = new Date(r.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", timeZone:"Asia/Kolkata" }); dayMap.set(d,(dayMap.get(d)||0)+1); });
  const sources = [...new Set(rows.map(r=>r.source))].map(name=>({name:String(name), value:rows.filter(r=>r.source===name).length}));
  const attendance = ["Attended","No-show","Pending"].map(name=>({name,value:rows.filter(r=>r.attendance_status===name).length}));
  const sessions=(sessionRows.data||[]).map(s=>({date:new Date(`${s.session_date}T00:00:00`).toLocaleDateString("en-IN",{day:"numeric",month:"short"}),registrations:rows.filter(r=>r.camp_session_id===s.id).length}));
  return <><div className="admin-page-heading"><div><p>Overview</p><h1>Hospital dashboard</h1><span>Live registration and camp performance.</span></div></div><section className="admin-kpi-grid">{cards.map(([label,value])=><article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section><DashboardCharts trend={[...dayMap].map(([date,registrations])=>({date,registrations}))} sessions={sessions} sources={sources} attendance={attendance}/></>;
}
