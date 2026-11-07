import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import "./risk-leads.css";

export const dynamic = "force-dynamic";
const pageSize = 25;
const formatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const tiers: Record<string, string> = { low: "Low", slightlyElevated: "Slightly elevated", moderate: "Moderate", high: "High", veryHigh: "Very high" };

export default async function DiabetesRiskLeadsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const requested = Number((await searchParams).page || 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const db = await createClient();
  const { data, error, count } = await db.from("findrisc_leads")
    .select("id,attendee_name,contact_phone,contact_email,score,risk_tier,created_at,consented_at", { count: "exact" })
    .order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  const pages = Math.max(1, Math.ceil((count || 0) / pageSize));
  return <div className="risk-admin"><header><p>Patient CRM · consented follow-up</p><h1>FINDRISC submissions</h1><span>{count ?? "—"} saved submissions · {pageSize} per page. Scores are screening estimates, not diagnoses.</span></header>
    {error ? <div className="risk-admin-notice" role="alert">Submissions could not be loaded. Confirm the FINDRISC leads migration is applied and your staff account has access.</div>
      : !data?.length ? <div className="risk-admin-notice">No requests on this page.</div>
      : <div className="risk-admin-scroll"><table><thead><tr><th>Submitted (IST)</th><th>Name</th><th>Contact</th><th>Score</th><th>Risk tier</th><th>Consent (IST)</th></tr></thead><tbody>{data.map(row => <tr key={row.id}><td>{formatter.format(new Date(row.created_at))}</td><td>{row.attendee_name}</td><td>{row.contact_email ? <a href={`mailto:${row.contact_email}`}>{row.contact_email}</a> : null}{row.contact_email && row.contact_phone ? <br /> : null}{row.contact_phone ? <a href={`tel:+91${row.contact_phone}`}>{row.contact_phone}</a> : null}</td><td><strong>{row.score}/26</strong></td><td>{tiers[row.risk_tier] || row.risk_tier}</td><td>{formatter.format(new Date(row.consented_at))}</td></tr>)}</tbody></table></div>}
    <nav className="risk-admin-pagination" aria-label="Risk request pages"><Link aria-disabled={page <= 1} href={`/admin/diabetes-risk-leads?page=${Math.max(1, page - 1)}`}>Previous</Link><span>Page {page} of {pages}</span><Link aria-disabled={page >= pages} href={`/admin/diabetes-risk-leads?page=${Math.min(pages, page + 1)}`}>Next</Link></nav>
  </div>;
}
