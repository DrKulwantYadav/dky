export const clinicPostalAddress = "Dr. Kulwant Yadav, Gopinath Hospital, H-226, Industrial Area, Bhiwadi 301019, Rajasthan, India";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character] || character);

export function validCampaignUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; }
  catch { return null; }
}

export function renderMarketingEmail(input: {
  subject: string; body: string; ctaLabel: string | null; ctaUrl: string | null;
  recipientName: string; unsubscribeUrl: string;
}) {
  const ctaUrl = input.ctaUrl ? validCampaignUrl(input.ctaUrl) : null;
  const paragraphs = input.body.trim().split(/\n\s*\n/).map(part => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`).join("");
  const ctaHtml = ctaUrl && input.ctaLabel ? `<p><a href="${escapeHtml(ctaUrl)}">${escapeHtml(input.ctaLabel)}</a></p>` : "";
  const ctaText = ctaUrl && input.ctaLabel ? `\n\n${input.ctaLabel}: ${ctaUrl}` : "";
  return {
    subject: input.subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto;color:#102a43"><p>Hello ${escapeHtml(input.recipientName)},</p>${paragraphs}${ctaHtml}<hr><p style="font-size:12px;color:#526760">You received this because you opted in to clinic emails. ${escapeHtml(clinicPostalAddress)}<br><a href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe from marketing emails</a></p></div>`,
    text: `Hello ${input.recipientName},\n\n${input.body.trim()}${ctaText}\n\nYou received this because you opted in to clinic emails.\n${clinicPostalAddress}\nUnsubscribe: ${input.unsubscribeUrl}`,
  };
}
