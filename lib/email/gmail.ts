import "server-only";
import { buildGmailMessage, gmailSendOutcome, type GmailSendResult } from "./gmail-core";

const address = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function gmailEmailConfig() {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
  const from = process.env.GMAIL_SENDER_EMAIL?.trim().toLowerCase();
  return clientId && clientSecret && refreshToken && from && address.test(from)
    ? { clientId, clientSecret, refreshToken, from } : null;
}

export async function sendGmailEmail(args: {
  config: NonNullable<ReturnType<typeof gmailEmailConfig>>;
  from: string; to: string; subject: string; html: string; text: string;
  deliveryKey: string; headers?: Record<string, string>;
}): Promise<GmailSendResult> {
  if (args.from.toLowerCase() !== args.config.from)
    return { status: "failed", providerId: null, errorCode: "gmail_sender_mismatch" };
  let raw: string;
  try { raw = buildGmailMessage(args); }
  catch { return { status: "failed", providerId: null, errorCode: "invalid_message" }; }

  // A failed token refresh cannot have sent a message, so this is safe to retry.
  let accessToken: string;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: args.config.clientId,
        client_secret: args.config.clientSecret, refresh_token: args.config.refreshToken,
        grant_type: "refresh_token" }),
    });
    const tokenBody: unknown = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || !tokenBody || typeof tokenBody !== "object" ||
        !("access_token" in tokenBody) || typeof tokenBody.access_token !== "string")
      return { status: "failed", providerId: null, errorCode: "gmail_oauth_unavailable" };
    accessToken = tokenBody.access_token;
  } catch { return { status: "failed", providerId: null, errorCode: "gmail_oauth_unavailable" }; }

  // Gmail has no idempotent send key. A timeout after this request
  // may still have delivered the message; do not automatically retry it.
  try {
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    const body: unknown = response.ok ? await response.json().catch(() => null) : null;
    return gmailSendOutcome(response.status, body);
  } catch { return { status: "uncertain", providerId: null, errorCode: "gmail_response_uncertain" }; }
}
