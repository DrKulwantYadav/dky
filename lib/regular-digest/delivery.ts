import "server-only";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";
import { renderRegularDigest, type DigestSnapshot } from "@/lib/regular-digest";
import { gmailEmailConfig, sendGmailEmail } from "@/lib/email/gmail";

const patient = z.object({
  name: z.string(), phone: z.string(), preferredDate: z.string().nullable(),
  preferredTime: z.string().nullable(), preferredTimeWindow: z.string().nullable(),
  registrationStatus: z.string(), confirmationStatus: z.string(),
});
const claimSchema = z.object({
  id: z.uuid(), claimToken: z.uuid(), date: z.string(), cutoffAt: z.string(),
  todayRequests: z.array(patient), tomorrowRequests: z.array(patient),
  senderEmail: z.email(), recipientEmail: z.email(),
});

export function regularDigestConfig() {
  return gmailEmailConfig();
}

export type DeliveryResult = "sent" | "failed" | "uncertain" | "skipped" | "unavailable";

export async function sendRegularDigestDelivery(id: string): Promise<DeliveryResult> {
  if (!z.uuid().safeParse(id).success) return "skipped";
  const config = regularDigestConfig();
  if (!config) return "unavailable";
  let db: ReturnType<typeof createSupabaseAdmin>;
  try { db = createSupabaseAdmin(); } catch { return "unavailable"; }
  let claim;
  try { claim = await db.rpc("claim_regular_appointment_digest", { p_id: id }); }
  catch { return "unavailable"; }
  if (claim.error) return "unavailable";
  if (!claim.data) return "skipped";
  const parsed = claimSchema.safeParse(claim.data);
  if (!parsed.success) return "unavailable";
  const job = parsed.data;
  const snapshot: DigestSnapshot = {
    date: job.date, cutoffAt: job.cutoffAt,
    todayRequests: job.todayRequests, tomorrowRequests: job.tomorrowRequests,
  };
  const email = renderRegularDigest(snapshot);
  const finish = async (status: "sent" | "failed" | "uncertain", providerId: string | null, errorCode: string | null): Promise<DeliveryResult> => {
    try {
      const result = await db.rpc("finish_regular_appointment_digest", {
        p_id: job.id, p_claim_token: job.claimToken, p_status: status,
        p_provider_id: providerId, p_error_code: errorCode,
      });
      return result.error || !result.data ? "unavailable" : status;
    } catch { return "unavailable"; }
  };
  const result = await sendGmailEmail({ config, from: job.senderEmail,
    to: job.recipientEmail, subject: email.subject, html: email.html, text: email.text,
    deliveryKey: `regular-digest/${job.date}/${job.id}` });
  return finish(result.status, result.providerId, result.errorCode);
}
