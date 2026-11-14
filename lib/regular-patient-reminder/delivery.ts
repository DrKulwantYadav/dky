import "server-only";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";
import { gmailEmailConfig, sendGmailEmail } from "@/lib/email/gmail";
import { renderPatientReminder } from "@/lib/regular-patient-reminder";

const claimSchema = z.object({
  id: z.uuid(), claimToken: z.uuid(), date: z.string(), cutoffAt: z.string(),
  recipientEmail: z.email(), recipientName: z.string(),
  appointmentDate: z.string(), appointmentTime: z.string().nullable(),
  appointmentTimeWindow: z.string().nullable(), senderEmail: z.email(),
});
export type PatientReminderResult = "sent" | "failed" | "uncertain" | "skipped" | "unavailable";

export async function sendPatientReminder(id: string): Promise<PatientReminderResult> {
  if (!z.uuid().safeParse(id).success) return "skipped";
  const config = gmailEmailConfig();
  if (!config) return "unavailable";
  let db: ReturnType<typeof createSupabaseAdmin>;
  try { db = createSupabaseAdmin(); } catch { return "unavailable"; }
  let claim;
  try { claim = await db.rpc("claim_regular_patient_reminder", { p_id: id }); }
  catch { return "unavailable"; }
  if (claim.error) return "unavailable";
  if (!claim.data) return "skipped";
  const parsed = claimSchema.safeParse(claim.data);
  if (!parsed.success) return "unavailable";
  const job = parsed.data;
  const email = renderPatientReminder(job);
  const result = await sendGmailEmail({ config, from: config.from,
    to: job.recipientEmail, subject: email.subject, html: email.html, text: email.text,
    deliveryKey: `regular-patient-reminder/${job.date}/${job.id}` });
  try {
    const finished = await db.rpc("finish_regular_patient_reminder", {
      p_id: job.id, p_claim_token: job.claimToken, p_status: result.status,
      p_provider_id: result.providerId, p_error_code: result.errorCode,
    });
    return finished.error || !finished.data ? "unavailable" : result.status;
  } catch { return "unavailable"; }
}
