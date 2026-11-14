import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";
import { regularDigestConfig, sendRegularDigestDelivery } from "@/lib/regular-digest/delivery";
import { sendPatientReminder } from "@/lib/regular-patient-reminder/delivery";

export const runtime = "nodejs";
export const maxDuration = 60;

async function pendingIds(db: ReturnType<typeof createSupabaseAdmin>, table: string, date: string) {
  const ids: string[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await db.from(table).select("id").eq("digest_date", date)
      .in("status", ["pending", "processing"]).order("id").range(offset, offset + 499);
    if (page.error || !page.data) throw new Error("Could not read delivery IDs");
    ids.push(...page.data.map(row => row.id));
    if (page.data.length < 500) return ids;
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  const config = regularDigestConfig();
  if (!config) return new Response("Email provider is not configured", { status: 503 });
  let db: ReturnType<typeof createSupabaseAdmin>;
  try { db = createSupabaseAdmin(); } catch { return new Response("Database is not configured", { status: 503 }); }
  let prepared;
  try { prepared = await db.rpc("prepare_regular_appointment_digest", { p_sender_email: config.from }); }
  catch { return new Response("Digest could not be prepared", { status: 503 }); }
  if (!prepared || prepared.error || typeof prepared.data !== "string")
    return new Response("Digest could not be prepared", { status: 503 });
  let patientPrepared;
  try { patientPrepared = await db.rpc("prepare_regular_patient_reminders", { p_digest_date: prepared.data }); }
  catch { return new Response("Patient reminders could not be prepared", { status: 503 }); }
  if (patientPrepared.error) return new Response("Patient reminders could not be prepared", { status: 503 });

  let staffIds: string[];
  let patientIds: string[];
  try {
    [staffIds, patientIds] = await Promise.all([
      pendingIds(db, "regular_appointment_digest_deliveries", prepared.data),
      pendingIds(db, "regular_appointment_patient_reminder_deliveries", prepared.data),
    ]);
  } catch { return new Response("Email deliveries could not be read", { status: 503 }); }

  const staffResults: string[] = [];
  const patientResults: string[] = [];
  for (let offset = 0; offset < patientIds.length; offset += 5)
    patientResults.push(...await Promise.all(patientIds.slice(offset, offset + 5).map(sendPatientReminder)));
  for (let offset = 0; offset < staffIds.length; offset += 5)
    staffResults.push(...await Promise.all(staffIds.slice(offset, offset + 5).map(sendRegularDigestDelivery)));

  const failed = [...staffResults, ...patientResults].filter(x => x === "failed" || x === "uncertain" || x === "unavailable").length;
  return Response.json({ date: prepared.data,
    staffSent: staffResults.filter(x => x === "sent").length,
    patientRemindersSent: patientResults.filter(x => x === "sent").length,
    failed, skipped: [...staffResults, ...patientResults].filter(x => x === "skipped").length,
  }, { status: failed ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
