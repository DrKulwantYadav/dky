import { whatsappConfig } from "./config";

const campUrl = "https://www.drkulwantyadav.com/world-heart-day-free-ecg-camp";

async function send(payload: Record<string, unknown>) {
  const config = whatsappConfig();
  const response = await fetch(
    `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API ${response.status}: ${error.slice(0, 300)}`);
  }
  return response.json() as Promise<{ messages?: Array<{ id: string }> }>;
}

export function sendTextMessage(to: string, body: string, previewUrl = false) {
  return send({
    to,
    type: "text",
    text: { preview_url: previewUrl, body: body.slice(0, 4096) },
  });
}

export function sendConfirmation(to: string, patientName: string) {
  const safeName = patientName.replace(/[\r\n\t]+/g, " ").trim().slice(0, 80);
  return send({
    to,
    type: "text",
    text: {
      preview_url: false,
      body: `✅ Registration Confirmed!\n\nThank you Patient: ${safeName} for registering for the Free ECG & Heart Checkup Camp at Gopinath Hospital, Bhiwadi. ❤️\n\n📅 Sunday, 6 September\n⏰ 9:00 AM – 1:00 PM\n📍 Gopinath Hospital, Bhiwadi.`,
    },
  });
}

export function sendShareFollowUp(to: string) {
  return send({
    to,
    type: "text",
    text: {
      preview_url: true,
      body: `Share this Free ECG & Heart Checkup Camp with your parents, family members, and loved ones today. They've always cared for you. This Sunday take a step for their heart health.\n\nRegister them directly here: ${campUrl} ✨`,
    },
  });
}

export function sendHelpMenu(to: string) {
  return send({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Free ECG Camp" },
      body: { text: "How can we help you?" },
      action: {
        button: "Choose an option",
        sections: [{
          title: "Camp assistance",
          rows: [
            { id: "registration", title: "My Registration" },
            { id: "date_time", title: "Camp Date & Time" },
            { id: "location", title: "Hospital Location" },
            { id: "family", title: "Register Family Member" },
            { id: "share", title: "Share Camp Details" },
            { id: "website", title: "Camp Information / Website" },
            { id: "hospital_team", title: "Talk to Hospital Team" },
          ],
        }],
      },
    },
  });
}

export function sendStaffBusyMessage(to: string) {
  return sendTextMessage(
    to,
    "Thank you for responding. Our hospital staff are currently busy and will connect with you as soon as possible.",
  );
}
