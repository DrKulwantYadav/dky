import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { gmailEmailConfig } from "@/lib/email/gmail";
import { PageHead } from "../free-camp-registrations/page";
import MarketingEditor from "./MarketingEditor";
import "./marketing.css";

export default async function MarketingEmailPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const admin = await requireAdmin();
  if (admin.profile.role === "staff") notFound();
  const { id } = await searchParams;
  const db = await createClient();
  const [campaignsResult, eligibleResult] = await Promise.all([
    db.from("marketing_email_campaigns").select("id,subject,body,cta_label,cta_url,status,recipient_count,created_at,queued_at")
      .order("created_at", { ascending: false }).limit(30),
    db.from("marketing_email_subscribers").select("email", { count: "exact", head: true }).is("unsubscribed_at", null),
  ]);
  const campaigns = campaignsResult.data || [];
  const selected = id ? campaigns.find(row => row.id === id) : null;
  const statuses = ["sent", "pending", "processing", "failed", "uncertain", "skipped"];
  const deliveryResults = selected ? await Promise.all([
    db.from("marketing_email_campaign_deliveries").select("recipient_email,status,attempts,error_code,sent_at")
      .eq("campaign_id", selected.id).order("created_at").limit(50),
    ...statuses.map(status => db.from("marketing_email_campaign_deliveries")
      .select("id", { count: "exact", head: true }).eq("campaign_id", selected.id).eq("status", status)),
  ]) : null;
  const totals = deliveryResults ? Object.fromEntries(statuses.map((status, index) => [status, deliveryResults[index + 1].count || 0])) : {};
  return <>
    <PageHead title="Email campaigns" subtitle="Draft and send clinic emails only to people who opted in separately." />
    {(campaignsResult.error || eligibleResult.error) && <p className="admin-alert error">Marketing tables are unavailable. Apply the marketing migration in a test project before using this page.</p>}
    {(!gmailEmailConfig() || !process.env.MARKETING_BASE_URL) && <p className="admin-alert error">Sending is unavailable. Configure the server-only Gmail OAuth sender and MARKETING_BASE_URL.</p>}
    <p><strong>{eligibleResult.count || 0}</strong> currently opted-in email recipients. Existing patients were not enrolled automatically. Unsubscribed addresses are excluded at send time.</p>
    <div className="marketing-layout">
      <MarketingEditor key={selected?.id || "new"} campaign={selected || null} eligibleCount={eligibleResult.count || 0} />
      <section className="admin-panel"><h2>Campaigns</h2><p><Link href="/admin/marketing-email">Create new draft</Link></p>
        {campaigns.length ? campaigns.map(row => <p key={row.id}><Link href={`/admin/marketing-email?id=${row.id}`}>{row.subject}</Link><br/><small>{row.status} · {row.recipient_count} queued · {new Date(row.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</small></p>) : <p>No campaigns yet.</p>}
      </section>
    </div>
    {selected && <section className="admin-panel" style={{ marginTop: 20 }}><h2>Delivery results for {selected.subject}</h2>
      <p>{Object.entries(totals).map(([key, value]) => `${key}: ${value}`).join(" · ")}. The table shows the first 50 recipients; totals cover the full campaign. “Sent” means accepted by Gmail, not delivered or read. Uncertain sends are held for manual review.</p>
      {deliveryResults?.[0].error ? <p className="admin-alert error">Delivery status unavailable.</p>
        : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>Status</th><th>Attempts</th><th>Result</th></tr></thead><tbody>{(deliveryResults?.[0].data || []).map(row => <tr key={row.recipient_email}><td>{row.recipient_email}</td><td>{row.status}</td><td>{row.attempts}</td><td>{row.sent_at ? new Date(row.sent_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : row.error_code || "—"}</td></tr>)}</tbody></table></div>}
    </section>}
  </>;
}
