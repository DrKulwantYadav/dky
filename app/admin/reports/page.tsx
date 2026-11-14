import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { regularDigestConfig } from "@/lib/regular-digest/delivery";
import { gmailEmailConfig } from "@/lib/email/gmail";
import { PageHead } from "../free-camp-registrations/page";
import DigestRetryButton from "./DigestRetryButton";

type DigestRun = { digest_date: string; cutoff_at: string; patient_reminders_no_email_count: number };
type DigestDelivery = { id: string; digest_date: string; recipient_email: string;
  status: string; attempts: number; error_code: string | null; sent_at: string | null; lease_until: string | null };
type PatientDelivery = DigestDelivery & { recipient_name: string };

const indiaTime = (value: string) => new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
}).format(new Date(value));

export default async function Reports() {
  const admin = await requireAdmin();
  const db = await createClient();
  const [camp, regular, confirmed, attended, noShow, digestResult] = await Promise.all([
    db.from("camp_registrations").select("*", { count: "exact", head: true }),
    db.from("regular_registrations").select("*", { count: "exact", head: true }),
    db.from("camp_registrations").select("*", { count: "exact", head: true }).eq("confirmation_status", "Confirmed"),
    db.from("camp_registrations").select("*", { count: "exact", head: true }).eq("attendance_status", "Attended"),
    db.from("camp_registrations").select("*", { count: "exact", head: true }).eq("attendance_status", "No-show"),
    db.from("regular_appointment_digest_runs").select("digest_date,cutoff_at,patient_reminders_no_email_count").order("digest_date", { ascending: false }).limit(7),
  ]);
  const runs = (digestResult.data || []) as DigestRun[];
  const [deliveriesResult, patientResult] = runs.length ? await Promise.all([
    db.from("regular_appointment_digest_deliveries")
      .select("id,digest_date,recipient_email,status,attempts,error_code,sent_at,lease_until")
      .in("digest_date", runs.map(run => run.digest_date)).order("recipient_email"),
    db.from("regular_appointment_patient_reminder_deliveries")
      .select("id,digest_date,recipient_name,recipient_email,status,attempts,error_code,sent_at,lease_until")
      .in("digest_date", runs.map(run => run.digest_date)).order("recipient_name"),
  ]) : [null, null];
  const deliveries = (deliveriesResult?.data || []) as DigestDelivery[];
  const patientDeliveries = (patientResult?.data || []) as PatientDelivery[];
  const canRetry = admin.profile.role === "admin" || admin.profile.role === "super_admin";
  const totalCamp = camp.count || 0;
  const rate = (count: number, total: number) => total ? `${Math.round(count / total * 100)}%` : "0%";
  return <>
    <PageHead title="Reports" subtitle="Registration, confirmation and attendance performance." />
    <form className="admin-filters"><label>From<input type="date" name="from" /></label><label>To<input type="date" name="to" /></label><button>Apply range</button></form>
    <section className="report-grid">{[
      ["Total leads", totalCamp + (regular.count || 0)], ["Camp registrations", totalCamp],
      ["Regular registrations", regular.count || 0], ["Confirmation rate", rate(confirmed.count || 0, totalCamp)],
      ["Attendance rate", rate(attended.count || 0, totalCamp)], ["No-show rate", rate(noShow.count || 0, totalCamp)],
    ].map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="admin-panel" aria-labelledby="regular-digest-title" style={{ marginTop: 24 }}>
      <h2 id="regular-digest-title">Nightly regular appointment emails</h2>
      <p>At about 10 pm IST, active clinic admins receive a snapshot and booked patients with an email may receive a next-day reminder. The regular registrations dashboard remains the current source of truth.</p>
      {!regularDigestConfig() && <p className="admin-alert error">Email sending is not configured on this server. Set the server-only Gmail OAuth sender values.</p>}
      {!gmailEmailConfig() && <p className="admin-alert error">Patient reminders are not configured. Set the server-only Gmail OAuth sender values. Staff digest settings are separate.</p>}
      {digestResult.error || deliveriesResult?.error || patientResult?.error
        ? <p className="admin-alert error">Digest history is unavailable. Check the daily digest migration and database permissions.</p>
        : runs.length === 0 ? <p>No nightly digest has run yet.</p> : runs.map(run => {
          const recipients = deliveries.filter(delivery => delivery.digest_date === run.digest_date);
          const patients = patientDeliveries.filter(delivery => delivery.digest_date === run.digest_date);
          return <div key={run.digest_date} style={{ marginTop: 20 }}>
            <h3>{run.digest_date} · snapshot {indiaTime(run.cutoff_at)} IST</h3>
            <p><strong>Staff summary:</strong> {recipients.filter(row => row.status === "sent").length} accepted by Gmail · {recipients.filter(row => row.status !== "sent").length} not confirmed sent</p>
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Recipient</th><th>Delivery</th><th>Attempts</th><th>Last result</th><th>Action</th></tr></thead><tbody>{recipients.map(row => {
              const retryable = canRetry && row.status === "failed" && row.attempts < 5 && Date.now() - Date.parse(run.cutoff_at) < 23 * 3600_000;
              return <tr key={row.id}><td>{row.recipient_email}</td><td><strong>{row.status}</strong></td><td>{row.attempts}</td><td>{row.sent_at ? `Accepted ${indiaTime(row.sent_at)} IST` : row.error_code || "—"}</td><td>{retryable ? <DigestRetryButton deliveryId={row.id} /> : "—"}</td></tr>;
            })}</tbody></table></div>
            <p><strong>Patient reminders:</strong> {patients.filter(row => row.status === "sent").length} accepted by Gmail · {patients.filter(row => row.status !== "sent").length} not confirmed sent · {run.patient_reminders_no_email_count} booked requests had no valid email at snapshot. Uncertain sends need manual review in Gmail Sent.</p>
            {patients.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Patient</th><th>Email</th><th>Delivery</th><th>Attempts</th><th>Last result</th><th>Action</th></tr></thead><tbody>{patients.map(row => {
              const todayIst = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
              const retryable = canRetry && run.digest_date === todayIst && row.status === "failed" && row.attempts < 5 && Date.now() - Date.parse(run.cutoff_at) < 23 * 3600_000;
              return <tr key={row.id}><td>{row.recipient_name}</td><td>{row.recipient_email}</td><td><strong>{row.status}</strong></td><td>{row.attempts}</td><td>{row.sent_at ? `Accepted ${indiaTime(row.sent_at)} IST` : row.error_code || "—"}</td><td>{retryable ? <DigestRetryButton deliveryId={row.id} kind="patient" /> : "—"}</td></tr>;
            })}</tbody></table></div>}
          </div>;
        })}
    </section>
  </>;
}
