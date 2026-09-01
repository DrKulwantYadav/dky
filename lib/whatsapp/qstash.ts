import { Client } from "@upstash/qstash";
import { qstashConfig } from "./config";

export async function scheduleWhatsAppFollowUp(pendingLogId: string) {
  const { token, destinationUrl } = qstashConfig();
  const client = new Client({ token, enableTelemetry: false });
  return client.publishJSON({
    url: destinationUrl,
    body: { pendingLogId },
    delay: "1m",
    retries: 3,
    contentBasedDeduplication: true,
    label: "whatsapp-ecg-follow-up",
  });
}
