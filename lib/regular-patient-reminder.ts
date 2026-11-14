export type PatientReminder = {
  recipientName: string;
  appointmentDate: string;
  appointmentTime: string | null;
  appointmentTimeWindow: string | null;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character] || character);
const slotLabel = (value: string) => {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const clock = (minutes: number) => {
    const hour = Math.floor(minutes / 60);
    return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
  };
  return `${clock(start)} – ${clock(start + 30)}`;
};

export function renderPatientReminder(reminder: PatientReminder) {
  const date = new Date(`${reminder.appointmentDate}T12:00:00Z`)
    .toLocaleDateString("en-IN", { dateStyle: "full", timeZone: "UTC" });
  const time = reminder.appointmentTime ? slotLabel(reminder.appointmentTime)
    : reminder.appointmentTimeWindow || "Time to be confirmed by the clinic";
  const location = "Gopinath Hospital, H-226, Industrial Area, near Ramphal Cinema, Bhiwadi, Rajasthan 301019";
  const subject = "Reminder: your clinic visit tomorrow";
  const text = `Hello ${reminder.recipientName},\n\nThis is a reminder of your appointment with Dr. Kulwant Yadav tomorrow, ${date}, ${time} IST.\n\nLocation: ${location}.\n\nPlease check in with reception when you arrive. If your plans have changed, call the clinic at +91 92057 75932.\n\nThis email does not change your booking. It was sent because an email address was provided with your appointment request.`;
  const html = `<main style="font-family:Arial,sans-serif;color:#102a43;line-height:1.6;max-width:620px;margin:auto"><h1 style="font-family:Georgia,serif">Your clinic visit tomorrow</h1><p>Hello ${escapeHtml(reminder.recipientName)},</p><p>This is a reminder of your appointment with Dr. Kulwant Yadav tomorrow.</p><p><strong>Date:</strong> ${escapeHtml(date)}<br><strong>Time:</strong> ${escapeHtml(time)} IST<br><strong>Location:</strong> ${escapeHtml(location)}</p><p><strong>Please check in with reception when you arrive.</strong></p><p>If your plans have changed, call the clinic at <a href="tel:+919205775932">+91 92057 75932</a>.</p><p style="color:#536674;font-size:13px">This email does not change your booking. It was sent because an email address was provided with your appointment request.</p></main>`;
  return { subject, text, html };
}
