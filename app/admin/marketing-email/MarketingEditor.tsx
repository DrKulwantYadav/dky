"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Campaign = { id: string; subject: string; body: string; cta_label: string | null;
  cta_url: string | null; status: string; recipient_count: number };

export default function MarketingEditor({ campaign, eligibleCount }: { campaign: Campaign | null; eligibleCount: number }) {
  const router = useRouter();
  const [subject, setSubject] = useState(campaign?.subject || "");
  const [body, setBody] = useState(campaign?.body || "");
  const [ctaLabel, setCtaLabel] = useState(campaign?.cta_label || "");
  const [ctaUrl, setCtaUrl] = useState(campaign?.cta_url || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const editable = !campaign || campaign.status === "draft";
  const dirty = !!campaign && (subject !== campaign.subject || body !== campaign.body ||
    ctaLabel !== (campaign.cta_label || "") || ctaUrl !== (campaign.cta_url || ""));

  async function call(action: string, fields: Record<string, unknown>) {
    const response = await fetch("/api/admin/marketing-email", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...fields }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed.");
    return result;
  }
  async function save() {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await call("save", { id: campaign?.id, subject, body, ctaLabel, ctaUrl });
      setMessage("Draft saved in the database.");
      router.push(`/admin/marketing-email?id=${result.id}`); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save draft."); }
    finally { setBusy(false); }
  }
  async function dispatch(id: string) {
    // Keep one browser action to at most 80 recipients. Gmail's mailbox sending
    // limit is separate from its API quota, so staff must review pending sends.
    for (let batch = 0; batch < 10; batch++) {
      const result = await call("dispatch", { id });
      setMessage(`${result.sent} accepted by Gmail · ${result.pending} pending · ${result.failed} failed · ${result.uncertain} uncertain. Use Continue pending sends for the next batch.`);
      if (result.unavailable || result.pending === 0 || result.processed === 0) break;
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    router.refresh();
  }
  async function send() {
    if (!campaign || !window.confirm(`Send “${campaign.subject}” to ${eligibleCount} currently opted-in email addresses? This freezes the draft and queues individual deliveries.`)) return;
    setBusy(true); setError(""); setMessage("");
    try { const result = await call("queue", { id: campaign.id });
      setMessage(`${result.recipientCount} opted-in recipients queued. Sending…`);
      await dispatch(campaign.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not queue campaign."); }
    finally { setBusy(false); router.refresh(); }
  }
  async function resume(action: "dispatch" | "retry") {
    if (!campaign) return;
    setBusy(true); setError("");
    try {
      if (action === "retry") {
        if (!window.confirm("Retry definite failures only? Gmail cannot deduplicate an uncertain send; review those in Gmail Sent separately.")) return;
        const result = await call("retry", { id: campaign.id });
        setMessage(`${result.sent} accepted · ${result.failed} failed · ${result.uncertain} uncertain.`);
        router.refresh();
      } else await dispatch(campaign.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not continue campaign."); }
    finally { setBusy(false); }
  }
  return <section className="admin-panel"><h2>{campaign ? `Campaign · ${campaign.status}` : "New email draft"}</h2>
    <p>General clinic updates only. Do not include patient details or medical risk scores. Every email has an unsubscribe link and clinic address. Gmail sends up to 80 recipients per click; review the mailbox limit before continuing.</p>
    <div className="admin-form">
      <label>Subject<input value={subject} onChange={event => setSubject(event.target.value)} maxLength={150} disabled={!editable || busy} /></label>
      <label>Message<textarea value={body} onChange={event => setBody(event.target.value)} rows={10} maxLength={10000} disabled={!editable || busy} style={{ width: "100%", padding: 12, border: "1px solid #cedbd7", borderRadius: 10 }} /></label>
      <label>Optional button label<input value={ctaLabel} onChange={event => setCtaLabel(event.target.value)} maxLength={60} disabled={!editable || busy} /></label>
      <label>Optional HTTPS button URL<input value={ctaUrl} onChange={event => setCtaUrl(event.target.value)} maxLength={1000} disabled={!editable || busy} /></label>
    </div>
    <details><summary>Preview message</summary><div style={{ whiteSpace: "pre-wrap", padding: 16, border: "1px solid #dce6e3" }}><strong>{subject || "Subject"}</strong><p>Hello [recipient name],</p><p>{body || "Your message"}</p>{ctaLabel && ctaUrl && <p>{ctaLabel}: {ctaUrl}</p>}<hr/><small>Clinic address · unsubscribe link</small></div></details>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="admin-alert error">{error}</p>}
    {editable && <p><button className="admin-primary-button" onClick={save} disabled={busy}>Save draft</button>{campaign && <button style={{ marginLeft: 12 }} onClick={send} disabled={busy || dirty || eligibleCount === 0}>Send to opted-in recipients</button>}{dirty && <small> Save this draft before sending.</small>}</p>}
    {campaign && !editable && <p><button onClick={() => resume("dispatch")} disabled={busy}>Continue pending sends</button><button onClick={() => resume("retry")} disabled={busy} style={{ marginLeft: 12 }}>Retry definite failures</button></p>}
  </section>;
}
