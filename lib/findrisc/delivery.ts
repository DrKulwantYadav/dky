import "server-only";
import { Client } from "@upstash/qstash";
import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";
import { renderFindriscReport, type RiskTier } from "./report";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ClaimedReport = { id: string; claimToken: string; name: string; email: string; score: number; tier: RiskTier };
type ProcessResult = "accepted" | "pending" | "failed" | "skipped" | "unavailable";

export async function processFindriscReport(id: string): Promise<ProcessResult> {
  if (!uuid.test(id)) return "skipped";
  let db: ReturnType<typeof createSupabaseAdmin>;
  try { db = createSupabaseAdmin(); } catch { return "unavailable"; }
  const { data, error } = await db.rpc("claim_findrisc_report", { p_id: id });
  if (error) return "unavailable";
  if (!data) {
    const { data: current } = await db.from("findrisc_leads").select("report_status").eq("id", id).maybeSingle();
    return current?.report_status === "pending" || current?.report_status === "processing" ? "pending" : "skipped";
  }
  const job = data as ClaimedReport;
  const finish = async (accepted: boolean, providerId: string | null, errorCode: string | null, retryable: boolean) => {
    const { data: finished, error: finishError } = await db.rpc("finish_findrisc_report", {
      p_id: job.id, p_claim_token: job.claimToken, p_accepted: accepted,
      p_provider_id: providerId, p_error_code: errorCode, p_retryable: retryable,
    });
    if (finishError || !finished) return "unavailable" as const;
    return accepted ? "accepted" as const : retryable ? "pending" as const : "failed" as const;
  };
  if (!job.email || !/^\S+@\S+\.\S+$/.test(job.email)) return finish(false, null, "recipient_missing", false);
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.FINDRISC_REPORT_FROM_EMAIL?.trim();
  if (!apiKey || !fromEmail || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fromEmail))
    return finish(false, null, "provider_not_configured", false);

  let report: ReturnType<typeof renderFindriscReport>;
  try { report = renderFindriscReport({ name: job.name, score: job.score, tier: job.tier }); }
  catch { return finish(false, null, "invalid_report", false); }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
        "Idempotency-Key": `findrisc-report/${job.id}` },
      body: JSON.stringify({ from: `Dr. Kulwant Yadav <${fromEmail}>`, to: [job.email],
        subject: report.subject, html: report.html, text: report.text }),
    });
    if (response.ok) {
      const payload: unknown = await response.json();
      const providerId = payload && typeof payload === "object" && "id" in payload && typeof payload.id === "string" ? payload.id : null;
      return providerId ? finish(true, providerId, null, false) : finish(false, null, "provider_response_uncertain", true);
    }
    if (response.status === 429 || response.status >= 500) return finish(false, null, "provider_retryable", true);
    if (response.status === 409) {
      const payload: unknown = await response.json().catch(() => null);
      const concurrent = payload && typeof payload === "object" && "name" in payload && payload.name === "concurrent_idempotent_requests";
      return finish(false, null, concurrent ? "provider_concurrent" : "provider_conflict", Boolean(concurrent));
    }
    return finish(false, null, "provider_rejected", false);
  } catch { return finish(false, null, "provider_response_uncertain", true); }
}

export async function queueFindriscReport(id: string) {
  const token = process.env.QSTASH_TOKEN?.trim();
  const destination = process.env.QSTASH_FINDRISC_REPORT_URL?.trim();
  if (!uuid.test(id) || !token || !destination) return false;
  let url: URL;
  try { url = new URL(destination); } catch { return false; }
  if (url.protocol !== "https:" || url.pathname !== "/api/qstash/findrisc-reports") return false;
  try {
    const client = new Client({ token, enableTelemetry: false });
    await client.publishJSON({ url: url.toString(), body: { id }, retries: 6,
      retryDelay: "min(3600000, pow(4, retried) * 60000)", label: "findrisc-report" });
    return true;
  } catch { return false; }
}

export async function processDueFindriscReports(limit = 20) {
  let db: ReturnType<typeof createSupabaseAdmin>;
  try { db = createSupabaseAdmin(); } catch { return { available: false, accepted: 0, pending: 0, failed: 0 }; }
  const { data, error } = await db.rpc("list_due_findrisc_reports", { p_limit: limit });
  if (error || !Array.isArray(data)) return { available: false, accepted: 0, pending: 0, failed: 0 };
  const results: ProcessResult[] = [];
  // Bounded sequential delivery avoids sending a burst of medical reports at once.
  for (const id of data as string[]) results.push(await processFindriscReport(id));
  return { available: true, accepted: results.filter(result => result === "accepted").length,
    pending: results.filter(result => result === "pending").length,
    failed: results.filter(result => result === "failed" || result === "unavailable").length };
}
