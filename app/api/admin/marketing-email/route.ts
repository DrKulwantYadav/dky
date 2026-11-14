import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";
import { gmailEmailConfig } from "@/lib/email/gmail";
import { validCampaignUrl } from "@/lib/marketing-email";
import { sendMarketingDelivery } from "@/lib/marketing-email/delivery";

const draft = z.object({ action: z.literal("save"), id: z.uuid().optional(),
  subject: z.string().trim().min(3).max(150), body: z.string().trim().min(10).max(10000),
  ctaLabel: z.string().trim().max(60).optional(), ctaUrl: z.string().trim().max(1000).optional(),
});
const command = z.object({ action: z.enum(["queue", "dispatch", "retry"]), id: z.uuid() });

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host)
        return Response.json({ error: "Invalid request origin" }, { status: 403 });
    } catch { return Response.json({ error: "Invalid request origin" }, { status: 403 }); }
  }
  if (Number(request.headers.get("content-length") || 0) > 12000)
    return Response.json({ error: "Request too large" }, { status: 413 });
  const raw = await request.json().catch(() => null);
  const db = await createClient();
  if (raw?.action === "save") {
    const parsed = draft.safeParse(raw);
    if (!parsed.success) return Response.json({ error: "Check the subject, message and link." }, { status: 400 });
    const { id, subject, body, ctaLabel, ctaUrl } = parsed.data;
    if (!!ctaLabel !== !!ctaUrl || (ctaUrl && !validCampaignUrl(ctaUrl)))
      return Response.json({ error: "Use both a link label and an HTTPS URL, or leave both blank." }, { status: 400 });
    const values = { subject, body, cta_label: ctaLabel || null, cta_url: ctaUrl || null };
    const result = id
      ? await db.from("marketing_email_campaigns").update(values).eq("id", id).eq("status", "draft").select("id").single()
      : await db.from("marketing_email_campaigns").insert({ ...values, created_by: admin.user.id }).select("id").single();
    if (result.error || !result.data) return Response.json({ error: "Draft could not be saved. Check the migration and permissions." }, { status: 503 });
    return Response.json({ id: result.data.id });
  }
  const parsed = command.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Invalid campaign action" }, { status: 400 });
  const { action, id } = parsed.data;
  const config = gmailEmailConfig();
  const base = process.env.MARKETING_BASE_URL?.trim();
  if (!config || !base || !/^https:\/\/[^/?#]+$/.test(base))
    return Response.json({ error: "Configure Gmail OAuth and the HTTPS marketing base URL first." }, { status: 503 });
  let service: ReturnType<typeof createSupabaseAdmin>;
  try { service = createSupabaseAdmin(); }
  catch { return Response.json({ error: "Email queue database access is unavailable." }, { status: 503 }); }
  const campaign = await db.from("marketing_email_campaigns").select("id,status,recipient_count").eq("id", id).maybeSingle();
  if (campaign.error || !campaign.data) return Response.json({ error: "Campaign unavailable" }, { status: 404 });
  if (action === "queue") {
    if (campaign.data.status !== "draft") return Response.json({ error: "This campaign has already been queued." }, { status: 409 });
    const queued = await db.rpc("queue_marketing_email_campaign", { p_id: id, p_sender_email: config.from });
    if (queued.error) return Response.json({ error: "Could not queue campaign. Check opted-in recipients and migration." }, { status: 503 });
    return Response.json({ recipientCount: queued.data });
  }
  if (campaign.data.status !== "sending" && campaign.data.status !== "partial")
    return Response.json({ error: "Campaign is not queued." }, { status: 409 });
  if (action === "retry") {
    const audit = await db.from("admin_activity_logs").insert({ admin_id: admin.user.id,
      action: "Marketing email delivery retry requested", metadata: { campaign_id: id } });
    if (audit.error) return Response.json({ error: "Could not audit delivery retry." }, { status: 503 });
  }
  // Gmail does not deduplicate a repeated send. Uncertain deliveries require
  // reconciliation in Gmail before any separate decision to contact the patient.
  const statuses = action === "retry" ? ["failed"] : ["pending"];
  const selected = await service.from("marketing_email_campaign_deliveries")
    .select("id").eq("campaign_id", id).in("status", statuses).lt("attempts", 5)
    .order("created_at").limit(8);
  if (selected.error) return Response.json({ error: "Could not load delivery queue." }, { status: 503 });
  const results = await Promise.all((selected.data || []).map(row => sendMarketingDelivery(row.id)));
  const [pending, failed, uncertain, sent] = await Promise.all(
    ["pending", "failed", "uncertain", "sent"].map(status => service.from("marketing_email_campaign_deliveries")
      .select("id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", status)));
  if ([pending, failed, uncertain, sent].some(result => result.error))
    return Response.json({ error: "Delivery status unavailable. Refresh the campaign page." }, { status: 503 });
  if (!pending.count) await service.rpc("finalize_marketing_email_campaign", { p_id: id });
  return Response.json({ processed: results.length, sent: sent.count || 0, pending: pending.count || 0,
    failed: failed.count || 0, uncertain: uncertain.count || 0,
    unavailable: results.filter(result => result === "unavailable").length });
}
