import test from "node:test";
import assert from "node:assert/strict";
import { renderMarketingEmail, validCampaignUrl } from "../lib/marketing-email.ts";

test("marketing email escapes personal content and carries unsubscribe and address", () => {
  const email = renderMarketingEmail({ subject: "Clinic update", body: "New hours <script>alert(1)</script>",
    ctaLabel: "Visit us", ctaUrl: "https://www.drkulwantyadav.com/clinic-bhiwadi",
    recipientName: "Asha <b>", unsubscribeUrl: "https://www.drkulwantyadav.com/email/unsubscribe?token=abc" });
  assert.match(email.html, /Asha &lt;b&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /Unsubscribe from marketing emails/);
  assert.match(email.text, /Gopinath Hospital/);
});

test("campaign CTA allows HTTPS only", () => {
  assert.equal(validCampaignUrl("javascript:alert(1)"), null);
  assert.equal(validCampaignUrl("http://example.com"), null);
  assert.equal(validCampaignUrl("https://example.com/path"), "https://example.com/path");
});
