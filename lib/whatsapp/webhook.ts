import { createSupabaseAdmin, writeSystemLog } from "./supabase";
import { normalizeIndianPhone } from "./security";
import { sendConfirmation, sendHelpMenu, sendShareFollowUp, sendStaffBusyMessage, sendTextMessage } from "./messages";
import { scheduleWhatsAppFollowUp } from "./qstash";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function first(data: JsonRecord, names: string[]) {
  for (const name of names) {
    const value = text(data[name]);
    if (value) return value;
  }
  return "";
}

function parseFlowRegistration(message: JsonRecord) {
  const interactive = record(message.interactive);
  if (text(interactive.type) !== "nfm_reply") return null;
  const reply = record(interactive.nfm_reply);
  try {
    const data = record(JSON.parse(text(reply.response_json)));
    const name = first(data, ["patient_name", "full_name", "name"]);
    const ageValue = Number(first(data, ["patient_age", "age"]));
    const registrationFor = first(data, ["registration_for", "relationship"]) || "self";
    const allowed = new Set(["self", "parent", "sibling", "other"]);
    if (name.length < 2 || name.length > 80 || !Number.isInteger(ageValue) || ageValue < 1 || ageValue > 120 || !allowed.has(registrationFor)) return null;
    return { name, age: ageValue, registrationFor };
  } catch {
    return null;
  }
}

async function alreadyProcessed(messageId: string) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("system_logs")
    .select("id")
    .eq("integration", "Meta WhatsApp")
    .eq("payload->>message_id", messageId)
    .limit(1);
  return Boolean(data?.length);
}

async function register(message: JsonRecord, phone: string, registration: NonNullable<ReturnType<typeof parseFlowRegistration>>) {
  const supabase = createSupabaseAdmin();
  const { data: camp } = await supabase.from("camps").select("id").eq("active", true).eq("registration_open", true).order("start_date").limit(1).maybeSingle();
  if (!camp) throw new Error("No active camp is configured");

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .upsert({
      full_name: registration.name,
      phone,
      country_code: "+91",
      age: registration.age,
      source: "Meta Ads",
      campaign_name: "Free ECG Camp",
      landing_page: "/world-heart-day-free-ecg-camp",
      last_contact_at: new Date().toISOString(),
    }, { onConflict: "phone" })
    .select("id")
    .single();
  if (patientError || !patient) throw new Error(`Patient write failed: ${patientError?.code || "unknown"}`);

  const { data: campSession } = await supabase.from("camp_sessions").select("id").eq("camp_id", camp.id).eq("session_date", "2026-09-06").maybeSingle();
  const { data: existing } = await supabase.from("camp_registrations").select("id").eq("patient_id", patient.id).eq("camp_id", camp.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  let registrationId = existing?.id as string | undefined;
  if (!registrationId) {
    const { data: created, error } = await supabase.from("camp_registrations").insert({
      patient_id: patient.id,
      camp_id: camp.id,
      camp_session_id: campSession?.id || null,
      registration_for: registration.registrationFor,
      registration_status: "Registered",
      source: "Meta Ads",
    }).select("id").single();
    if (error || !created) throw new Error(`Registration write failed: ${error?.code || "unknown"}`);
    registrationId = created.id;
  }

  const result = await sendConfirmation(phone, registration.name);
  await supabase.from("camp_registrations").update({
    confirmation_status: "Confirmed",
    confirmation_template: "whatsapp_free_ecg_confirmation_text_v1",
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
  }).eq("id", registrationId);

  const pendingPayload = {
    message_id: text(message.id),
    registration_id: registrationId,
    phone,
    due_at: new Date(Date.now() + 60_000).toISOString(),
    confirmation_message_id: result.messages?.[0]?.id || null,
  };
  const { data: pending, error: pendingError } = await supabase
    .from("system_logs")
    .insert({ integration: "Meta WhatsApp", event: "follow_up_pending", payload: pendingPayload })
    .select("id")
    .single();
  if (pendingError || !pending) throw new Error(`Follow-up outbox write failed: ${pendingError?.code || "unknown"}`);

  try {
    const scheduled = await scheduleWhatsAppFollowUp(pending.id);
    await supabase.from("system_logs").update({
      payload: { ...pendingPayload, qstash_message_id: scheduled.messageId },
    }).eq("id", pending.id);
  } catch (scheduleError) {
    await supabase.from("system_logs").update({
      event: "follow_up_schedule_failed",
      error: scheduleError instanceof Error ? scheduleError.message.slice(0, 500) : "Unknown QStash error",
    }).eq("id", pending.id);
    throw scheduleError;
  }
}

async function handleReply(message: JsonRecord, phone: string) {
  const supabase = createSupabaseAdmin();
  const interactive = record(message.interactive);
  if (text(interactive.type) === "list_reply") {
    const selection = record(interactive.list_reply);
    const optionId = text(selection.id).slice(0, 80);
    await writeSystemLog("menu_selection_received", {
      message_id: text(message.id),
      phone,
      option_id: optionId,
      option_title: text(selection.title).slice(0, 120),
    });
    await handleMenuSelection(phone, optionId);
    return;
  }

  const conversationWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (await isPausedForStaff(phone, conversationWindowStart)) return;

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { data: pending } = await supabase
    .from("system_logs")
    .select("id,payload")
    .eq("integration", "Meta WhatsApp")
    .eq("event", "follow_up_pending")
    .eq("payload->>phone", phone)
    .gte("created_at", oneMinuteAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: menuCount } = await supabase
    .from("system_logs")
    .select("id", { count: "exact", head: true })
    .eq("integration", "Meta WhatsApp")
    .eq("event", "menu_sent")
    .eq("payload->>phone", phone)
    .gte("created_at", conversationWindowStart);

  if ((menuCount || 0) >= 2) {
    if (pending) await supabase.from("system_logs").update({ event: "follow_up_cancelled_by_reply" }).eq("id", pending.id);
    await pauseForStaff(phone, "menu_limit_reached");
    return;
  }

  await sendHelpMenu(phone);
  if (pending) await supabase.from("system_logs").update({ event: "follow_up_cancelled_by_reply" }).eq("id", pending.id);
  await writeSystemLog("menu_sent", {
    message_id: text(message.id),
    phone,
    pending_log_id: pending?.id || null,
    source: pending ? "registered_reply" : "general_inbound",
  });
}

async function isPausedForStaff(phone: string, since: string) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("system_logs")
    .select("id")
    .eq("integration", "Meta WhatsApp")
    .eq("event", "automation_paused_for_staff")
    .eq("payload->>phone", phone)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function pauseForStaff(phone: string, reason: string) {
  await sendStaffBusyMessage(phone);
  await writeSystemLog("automation_paused_for_staff", { phone, reason });
}

async function handleMenuSelection(phone: string, optionId: string) {
  const supabase = createSupabaseAdmin();
  const conversationWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (await isPausedForStaff(phone, conversationWindowStart)) return;

  switch (optionId) {
    case "registration": {
      const { data } = await supabase
        .from("camp_registrations")
        .select("registration_status,confirmation_status,camp_sessions(session_date),patients!inner(full_name,phone)")
        .eq("patients.phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const patient = Array.isArray(data?.patients) ? data.patients[0] : data?.patients;
      const session = Array.isArray(data?.camp_sessions) ? data.camp_sessions[0] : data?.camp_sessions;
      if (!data || !patient) {
        await sendTextMessage(phone, "We could not find a camp registration for this WhatsApp number. You can register here: https://www.drkulwantyadav.com/world-heart-day-free-ecg-camp", true);
        return;
      }
      await sendTextMessage(phone, `Registration found ✅\n\nPatient: ${patient.full_name}\nStatus: ${data.registration_status}\nConfirmation: ${data.confirmation_status}\nDate: ${session?.session_date || "Sunday, 6 September"}\nTime: 9:00 AM – 1:00 PM`);
      return;
    }
    case "date_time":
      await sendTextMessage(phone, "📅 Free ECG & Heart Checkup Camp\nSunday, 6 September\n⏰ 9:00 AM – 1:00 PM");
      return;
    case "location":
      await sendTextMessage(phone, "📍 Gopinath Hospital, Bhiwadi\n\nOpen the hospital location: https://www.google.com/maps/search/?api=1&query=Gopinath+Hospital+Bhiwadi", true);
      return;
    case "family":
      await sendTextMessage(phone, "Register a family member for the Free ECG & Heart Checkup Camp here: https://www.drkulwantyadav.com/world-heart-day-free-ecg-camp", true);
      return;
    case "share":
      await sendShareFollowUp(phone);
      return;
    case "website":
      await sendTextMessage(phone, "Find complete camp information here: https://www.drkulwantyadav.com/world-heart-day-free-ecg-camp", true);
      return;
    case "hospital_team":
      await pauseForStaff(phone, "hospital_team_selected");
      return;
    default:
      await sendTextMessage(phone, "That option is not available. Please send a new message to see the assistance menu again.");
  }
}

export async function processWebhook(payload: JsonRecord) {
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  for (const entryValue of entries) {
    const changes = Array.isArray(record(entryValue).changes) ? record(entryValue).changes as unknown[] : [];
    for (const changeValue of changes) {
      const messages = Array.isArray(record(record(changeValue).value).messages) ? record(record(changeValue).value).messages as unknown[] : [];
      for (const messageValue of messages) {
        const message = record(messageValue);
        const messageId = text(message.id);
        const phone = normalizeIndianPhone(text(message.from));
        if (!messageId || !phone || await alreadyProcessed(messageId)) continue;

        const registration = parseFlowRegistration(message);
        try {
          if (registration) await register(message, phone, registration);
          else await handleReply(message, phone);
          await writeSystemLog("webhook_processed", { message_id: messageId, phone, type: text(message.type) });
        } catch (error) {
          await writeSystemLog("webhook_failed", { message_id: messageId, phone }, error instanceof Error ? error.message : "Unknown error");
        }
      }
    }
  }
}
