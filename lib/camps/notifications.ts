import "server-only";
import { Client } from "@upstash/qstash";
import { campDatabase } from "./server";
import { sendCampConfirmationTemplate } from "@/lib/whatsapp/messages";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ClaimedJob = { jobId: string; phone: string; attendee: string; campName: string; date: string;
  startTime: string; endTime: string; venueName: string; venueAddress: string; token: string; bookingReference: string };

export async function queueCampNotification(jobId: string) {
  const token = process.env.QSTASH_TOKEN?.trim(), destination = process.env.QSTASH_CAMP_NOTIFICATION_URL?.trim();
  if (!token || !destination || !uuid.test(jobId)) return false;
  const parsed = new URL(destination);
  if (parsed.protocol !== "https:" || parsed.pathname !== "/api/qstash/camp-notifications") return false;
  const client = new Client({ token, enableTelemetry: false });
  await client.publishJSON({ url: parsed.toString(), body: { jobId }, retries: 3,
    contentBasedDeduplication: true, label: "camp-confirmation" });
  return true;
}

export async function processCampNotification(jobId: string) {
  if (!uuid.test(jobId)) return "invalid";
  const db = campDatabase();
  if (!db) return "unavailable";
  const { data, error } = await db.rpc("claim_camp_notification_job", { p_job_id: jobId });
  if (error) return "unavailable";
  if (!data) return "skipped";
  const job = data as ClaimedJob;
  try {
    const result = await sendCampConfirmationTemplate(job.phone.startsWith("91") ? job.phone : `91${job.phone}`, job);
    const { error: finishError } = await db.rpc("finish_camp_notification_job", {
      p_job_id: jobId, p_sent: true, p_provider_id: result.messages?.[0]?.id || null, p_error: null });
    return finishError ? "unavailable" : "sent";
  } catch (cause) {
    // Keep the reason in the restricted outbox, not in application logs or responses.
    const reason = cause instanceof Error ? cause.message : "Delivery failed";
    await db.rpc("finish_camp_notification_job", { p_job_id: jobId, p_sent: false, p_provider_id: null, p_error: reason });
    return "failed";
  }
}
