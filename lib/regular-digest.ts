export type DigestPatient = {
  name: string;
  phone: string;
  preferredDate: string | null;
  preferredTime: string | null;
  preferredTimeWindow: string | null;
  registrationStatus: string;
  confirmationStatus: string;
};

export type DigestSnapshot = {
  date: string;
  cutoffAt: string;
  todayRequests: DigestPatient[];
  tomorrowRequests: DigestPatient[];
};

const inIndia = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
});
const snapshotTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
});

export function indiaDates(now: Date) {
  const parts = Object.fromEntries(inIndia.formatToParts(now).map(part => [part.type, part.value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return { today, tomorrow: tomorrow.toISOString().slice(0, 10) };
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character] || character);
const displayDate = (value: string | null) => value
  ? new Date(`${value}T12:00:00Z`).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" })
  : "Not selected";
const displayTime = (row: DigestPatient) => {
  if (row.preferredTimeWindow) return row.preferredTimeWindow;
  if (!row.preferredTime) return "Not selected";
  const match = /^(\d{2}):(\d{2})/.exec(row.preferredTime);
  if (!match) return row.preferredTime;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "pm" : "am"} IST`;
};
const status = (value: string) => value === "Cancelled" || value === "No-show"
  ? `${value.toUpperCase()} — do not expect` : value;
const asText = (row: DigestPatient) =>
  `${row.name} | ${row.phone} | ${displayDate(row.preferredDate)} | ${displayTime(row)} | ${status(row.registrationStatus)} | Confirmation: ${row.confirmationStatus}`;
const asHtml = (row: DigestPatient) => {
  const caution = row.registrationStatus === "Cancelled" || row.registrationStatus === "No-show";
  const cells = [row.name, row.phone, displayDate(row.preferredDate), displayTime(row), status(row.registrationStatus), row.confirmationStatus];
  return `<tr>${cells.map((cell, index) => `<td style="padding:8px;border:1px solid #d9e1dc;${caution && index === 4 ? "color:#a3212b;font-weight:700;" : ""}">${escapeHtml(cell)}</td>`).join("")}</tr>`;
};

export function renderRegularDigest(snapshot: DigestSnapshot) {
  const cutoff = snapshotTime.format(new Date(snapshot.cutoffAt));
  const date = displayDate(snapshot.date);
  const tomorrow = displayDate(indiaDates(new Date(`${snapshot.date}T12:00:00Z`)).tomorrow);
  const subject = `Regular appointments · ${date} · nightly snapshot`;
  const sections = [
    { title: `Requests submitted today (${date})`, rows: snapshot.todayRequests, empty: "No regular appointment requests received today." },
    { title: `Preferred appointments for tomorrow (${tomorrow})`, rows: snapshot.tomorrowRequests, empty: "No requests listed for tomorrow." },
  ];
  const text = [`Regular appointment summary`, `Snapshot: ${cutoff} IST`, `The admin dashboard is the current source of truth.`,
    ...sections.flatMap(section => ["", `${section.title} — ${section.rows.length}`, section.rows.length ? section.rows.map(asText).join("\n") : section.empty]),
  ].join("\n");
  const html = `<main style="font-family:Arial,sans-serif;color:#102a43;line-height:1.5"><h1>Regular appointment summary</h1><p>Snapshot: ${escapeHtml(cutoff)} IST. The admin dashboard is the current source of truth.</p>${sections.map(section => `<section><h2>${escapeHtml(section.title)} — ${section.rows.length}</h2>${section.rows.length ? `<table style="border-collapse:collapse;width:100%"><thead><tr>${["Patient", "Mobile", "Preferred date", "Preferred time", "Registration", "Confirmation"].map(label => `<th style="padding:8px;border:1px solid #d9e1dc;text-align:left">${label}</th>`).join("")}</tr></thead><tbody>${section.rows.map(asHtml).join("")}</tbody></table>` : `<p>${escapeHtml(section.empty)}</p>`}</section>`).join("")}</main>`;
  return { subject, html, text };
}
