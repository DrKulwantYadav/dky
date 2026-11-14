import "server-only";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";
import { gmailEmailConfig, sendGmailEmail } from "@/lib/email/gmail";
import { renderMarketingEmail } from "@/lib/marketing-email";

const claimSchema = z.object({
  id: z.uuid(), claimToken: z.uuid(), campaignId: z.uuid(),
  recipientEmail: z.email(), recipientName: z.string(), unsubscribeToken: z.uuid(),
  senderEmail: z.email(), subject: z.string(), body: z.string(),
  ctaLabel: z.string().nullable(), ctaUrl: z.string().nullable(),
});

export async function sendMarketingDelivery(id: string) {
  const config = gmailEmailConfig();
  const base = process.env.MARKETING_BASE_URL?.trim();
  if (!config || !base || !/^https:\/\/[^/?#]+$/.test(base) || !z.uuid().safeParse(id).success)
    return "unavailable" as const;
  let db: ReturnType<typeof createSupabaseAdmin>;
  try { db = createSupabaseAdmin(); } catch { return "unavailable" as const; }
  let claim;
  try { claim = await db.rpc("claim_marketing_email_delivery", { p_id: id }); }
  catch { return "unavailable" as const; }
  if (claim.error) return "unavailable" as const;
  if (!claim.data) return "skipped" as const;
  const parsed = claimSchema.safeParse(claim.data);
  if (!parsed.success) return "unavailable" as const;
  const job = parsed.data;
  const token = encodeURIComponent(job.unsubscribeToken);
  const email = renderMarketingEmail({ ...job,
    unsubscribeUrl: `${base}/email/unsubscribe?token=${token}` });
  const result = await sendGmailEmail({ config, from: job.senderEmail,
    to: job.recipientEmail, ...email,
    deliveryKey: `marketing/${job.campaignId}/${job.id}`,
    headers: { "List-Unsubscribe": `<${base}/api/marketing/unsubscribe?token=${token}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
  try {
    const finished = await db.rpc("finish_marketing_email_delivery", {
      p_id: job.id, p_claim_token: job.claimToken, p_status: result.status,
      p_provider_id: result.providerId, p_error_code: result.errorCode,
    });
    return finished.error || !finished.data ? "unavailable" as const : result.status;
  } catch { return "unavailable" as const; }
}
