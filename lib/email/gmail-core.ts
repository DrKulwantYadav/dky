import { createHash } from "node:crypto";

export type GmailSendResult = {
  status: "sent" | "failed" | "uncertain";
  providerId: string | null;
  errorCode: string | null;
};

const address = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
const allowedHeaders = new Set(["List-Unsubscribe", "List-Unsubscribe-Post"]);

function base64Lines(value: string) {
  return Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n") || "";
}

export function buildGmailMessage(input: {
  from: string; to: string; subject: string; html: string; text: string;
  deliveryKey: string; headers?: Record<string, string>;
}) {
  if (!address.test(input.from) || !address.test(input.to) || !input.subject.trim() ||
      !input.deliveryKey.trim() || /[\r\n]/.test(input.subject + input.deliveryKey))
    throw new Error("Invalid email headers");
  const hash = createHash("sha256").update(input.deliveryKey).digest("hex").slice(0, 32);
  const boundary = `dky-${hash}`;
  const custom = Object.entries(input.headers || {}).map(([name, value]) => {
    if (!allowedHeaders.has(name) || /[\r\n]/.test(value)) throw new Error("Invalid email header");
    return `${name}: ${value}`;
  });
  const subject = `=?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`;
  const mime = [
    `From: Dr. Kulwant Yadav <${input.from}>`, `To: ${input.to}`, `Subject: ${subject}`,
    `X-DKY-Delivery-ID: ${hash}`, ...custom,
    "MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "", `--${boundary}`, 'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64", "", base64Lines(input.text),
    `--${boundary}`, 'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64", "", base64Lines(input.html),
    `--${boundary}--`, "",
  ].join("\r\n");
  return Buffer.from(mime, "utf8").toString("base64url");
}

export function gmailSendOutcome(status: number, body: unknown): GmailSendResult {
  if (status >= 200 && status < 300) {
    const id = body && typeof body === "object" && "id" in body && typeof body.id === "string"
      ? body.id : null;
    return id ? { status: "sent", providerId: id, errorCode: null }
      : { status: "uncertain", providerId: null, errorCode: "gmail_response_uncertain" };
  }
  if (status === 429 || status >= 500)
    return { status: "uncertain", providerId: null, errorCode: "gmail_response_uncertain" };
  return { status: "failed", providerId: null, errorCode: "gmail_rejected" };
}
