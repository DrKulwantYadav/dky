import { createSupabaseAdmin, writeSystemLog } from "./supabase";
import { normalizeIndianPhone } from "./security";
import { sendHelpMenu, sendStaffBusyMessage, sendTextMessage } from "./messages";

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

async function register(phone: string) {
  // Legacy WhatsApp flow has no explicit camp/session/slot. Never create an unslotted booking.
  await sendTextMessage(phone, "Please choose your health camp and arrival window at https://www.drkulwantyadav.com/camps . Your booking is confirmed only after a token appears on that page.", true);
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

  await sendHelpMenu(phone, "Health Camps");
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
        .select("participant_name,registration_status,confirmation_status,camp_sessions(session_date),camp_slots(start_time,end_time),patients!inner(full_name,phone)")
        .eq("patients.phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const patient = Array.isArray(data?.patients) ? data.patients[0] : data?.patients;
      const session = Array.isArray(data?.camp_sessions) ? data.camp_sessions[0] : data?.camp_sessions;
      const slot = Array.isArray(data?.camp_slots) ? data.camp_slots[0] : data?.camp_slots;
      if (!data || !patient) {
        await sendTextMessage(phone, "We could not find a camp registration for this WhatsApp number. View available camps at https://www.drkulwantyadav.com/camps", true);
        return;
      }
      await sendTextMessage(phone, `Registration found ✅\n\nAttendee: ${data.participant_name || patient.full_name}\nStatus: ${data.registration_status}\nConfirmation: ${data.confirmation_status}\nDate: ${session?.session_date || "Please contact the hospital"}\nArrival window: ${slot?.start_time && slot?.end_time ? `${slot.start_time}–${slot.end_time}` : "Please contact the hospital"}`);
      return;
    }
    case "date_time":
      await sendTextMessage(phone, "Current health camp dates and arrival windows are listed at https://www.drkulwantyadav.com/camps", true);
      return;
    case "location":
      await sendTextMessage(phone, "📍 Gopinath Hospital, Bhiwadi\n\nOpen the hospital location: https://www.google.com/maps/search/?api=1&query=Gopinath+Hospital+Bhiwadi", true);
      return;
    case "family":
      await sendTextMessage(phone, "Register a family member at https://www.drkulwantyadav.com/camps . Each attendee receives a separate token.", true);
      return;
    case "share":
      await sendTextMessage(phone, "Share available health camps with family and friends: https://www.drkulwantyadav.com/camps . Each person can choose an arrival window.", true);
      return;
    case "website":
      await sendTextMessage(phone, "Find current camp information here: https://www.drkulwantyadav.com/camps", true);
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
          if (registration) await register(phone);
          else await handleReply(message, phone);
          await writeSystemLog("webhook_processed", { message_id: messageId, phone, type: text(message.type) });
        } catch (error) {
          await writeSystemLog("webhook_failed", { message_id: messageId, phone }, error instanceof Error ? error.message : "Unknown error");
        }
      }
    }
  }
}
