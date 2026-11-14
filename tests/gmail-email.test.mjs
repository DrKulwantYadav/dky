import test from "node:test";
import assert from "node:assert/strict";
import { buildGmailMessage, gmailSendOutcome } from "../lib/email/gmail-core.ts";

test("Gmail raw MIME preserves Unicode content and unsubscribe headers", () => {
  const raw = buildGmailMessage({ from: "clinic@gmail.com", to: "person@example.com",
    subject: "कल appointment", text: "Hello ✓", html: "<p>Hello ✓</p>",
    deliveryKey: "digest/2026-11-12/recipient", headers: {
      "List-Unsubscribe": "<https://example.com/unsubscribe>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    } });
  const mime = Buffer.from(raw, "base64url").toString("utf8");
  assert.match(mime, /From: Dr\. Kulwant Yadav <clinic@gmail\.com>/);
  assert.match(mime, /X-DKY-Delivery-ID: [a-f0-9]{32}/);
  assert.match(mime, /List-Unsubscribe-Post: List-Unsubscribe=One-Click/);
  assert.ok(mime.includes(Buffer.from("Hello ✓").toString("base64")));
  assert.ok(mime.includes(Buffer.from("<p>Hello ✓</p>").toString("base64")));
});

test("untrusted input cannot inject Gmail headers", () => {
  const message = { from: "clinic@gmail.com", to: "person@example.com", subject: "Hello",
    text: "Hi", html: "<p>Hi</p>", deliveryKey: "one" };
  assert.throws(() => buildGmailMessage({ ...message, subject: "Hi\r\nBcc: someone@example.com" }));
  assert.throws(() => buildGmailMessage({ ...message, headers: { Bcc: "someone@example.com" } }));
});

test("Gmail uncertain outcomes are distinct from confirmed acceptance", () => {
  assert.deepEqual(gmailSendOutcome(200, { id: "gmail-id" }),
    { status: "sent", providerId: "gmail-id", errorCode: null });
  assert.equal(gmailSendOutcome(200, {}).status, "uncertain");
  assert.equal(gmailSendOutcome(503, null).status, "uncertain");
  assert.equal(gmailSendOutcome(429, null).status, "uncertain");
  assert.equal(gmailSendOutcome(400, null).status, "failed");
});
