import type { scoreFindrisc } from "@/lib/findrisc";

export type RiskTier = ReturnType<typeof scoreFindrisc>["tier"];
export type ReportDetails = { name: string; score: number; tier: RiskTier };

const riskCopy: Record<RiskTier, { label: string; odds: string; nextStep: string }> = {
  low: { label: "Low risk", odds: "about 1 in 100", nextStep: "Keep up everyday habits that support health. Discuss routine screening with your clinician." },
  slightlyElevated: { label: "Slightly elevated risk", odds: "about 1 in 25", nextStep: "Consider discussing activity, food habits and a screening plan with a clinician." },
  moderate: { label: "Moderate risk", odds: "about 1 in 6", nextStep: "Ask a clinician whether a blood glucose or HbA1c test would be appropriate." },
  high: { label: "High risk", odds: "about 1 in 3", nextStep: "Arrange a clinical discussion about blood testing and your individual risk factors." },
  veryHigh: { label: "Very high risk", odds: "about 1 in 2", nextStep: "Contact a clinician promptly to discuss appropriate blood testing and next steps." },
};

const disclaimer = "FINDRISC is a screening estimate, not a diagnosis. The 10-year figures are from the original Finnish population and may not reflect your individual risk in India. Only a qualified healthcare professional and laboratory blood test can confirm diabetes.";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);

export function renderFindriscReport(details: ReportDetails) {
  if (!Number.isInteger(details.score) || details.score < 0 || details.score > 26 || !Object.hasOwn(riskCopy, details.tier))
    throw new Error("Invalid report result");
  const name = details.name.trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) throw new Error("Invalid report name");
  const risk = riskCopy[details.tier];
  const subject = "Your health assessment report";
  const text = `Hello ${name},\n\nYour FINDRISC screening score: ${details.score} out of 26.\nRisk band: ${risk.label}.\nOriginal Finnish 10-year reference: ${risk.odds}.\n\n${risk.nextStep}\n\n${disclaimer}\n\nThis report was requested through Dr. Kulwant Yadav's website. If you did not request it, please contact the clinic.\nDr. Kulwant Yadav · Gopinath Hospital, Bhiwadi`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px;background:#f3f7f5;color:#102a43;font-family:Arial,sans-serif"><table role="presentation" style="width:100%;max-width:620px;margin:auto;border-collapse:collapse;background:#fff;border:1px solid #d5e1db"><tr><td style="padding:26px 30px;background:#102a43;color:#fff"><strong style="font-family:Georgia,serif;font-size:23px">Dr. Kulwant Yadav</strong><br><span style="font-size:11px;letter-spacing:1px">CONSULTANT INTERNAL MEDICINE</span></td></tr><tr><td style="padding:30px"><p style="margin:0 0 8px;color:#2f6f6d;font-size:11px;font-weight:bold;letter-spacing:1px">FINDRISC SCREENING REPORT</p><h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:31px;line-height:1.2">Your diabetes risk estimate</h1><p style="line-height:1.6">Hello ${escapeHtml(name)},</p><p style="line-height:1.6">Thank you for completing the assessment. Here is your result:</p><div style="padding:23px;background:#eaf3ef;border-left:4px solid #2f6f6d"><strong style="display:block;font-family:Georgia,serif;font-size:46px;line-height:1">${details.score}<span style="font-family:Arial,sans-serif;font-size:14px"> / 26</span></strong><span style="display:block;margin-top:8px;font-weight:bold">${risk.label}</span></div><p style="line-height:1.6">Original Finnish 10-year reference: <strong>${risk.odds}</strong>.</p><h2 style="margin:25px 0 8px;font-family:Georgia,serif;font-size:22px">A sensible next step</h2><p style="line-height:1.6">${risk.nextStep}</p><p style="padding-top:18px;border-top:1px solid #d5e1db;color:#536674;font-size:13px;line-height:1.6">${disclaimer}</p><p style="color:#536674;font-size:12px;line-height:1.6">This report was requested through Dr. Kulwant Yadav's website. If you did not request it, please contact the clinic.</p></td></tr><tr><td style="padding:18px 30px;background:#f3f7f5;color:#536674;font-size:12px">Dr. Kulwant Yadav · Gopinath Hospital, Bhiwadi</td></tr></table></body></html>`;
  return { subject, html, text };
}
