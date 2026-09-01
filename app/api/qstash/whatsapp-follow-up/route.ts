import { Receiver } from "@upstash/qstash";
import { createSupabaseAdmin, writeSystemLog } from "@/lib/whatsapp/supabase";
import { sendShareFollowUp } from "@/lib/whatsapp/messages";
import { qstashReceiverConfig } from "@/lib/whatsapp/config";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 2_000;

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return new Response("Payload too large", { status: 413 });
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) return new Response("Payload too large", { status: 413 });

  let receiver: Receiver;
  let destinationUrl: string;
  try {
    const config = qstashReceiverConfig();
    receiver = new Receiver({ currentSigningKey: config.currentSigningKey, nextSigningKey: config.nextSigningKey });
    destinationUrl = config.destinationUrl;
  } catch {
    return new Response("Unavailable", { status: 503 });
  }

  const signature = request.headers.get("upstash-signature");
  if (!signature) return new Response("Unauthorized", { status: 401 });
  try {
    const verified = await receiver.verify({
      signature,
      body: rawBody,
      url: destinationUrl,
      upstashRegion: request.headers.get("upstash-region") || undefined,
    });
    if (!verified) return new Response("Unauthorized", { status: 401 });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let pendingLogId = "";
  try {
    const body = JSON.parse(rawBody) as { pendingLogId?: unknown };
    pendingLogId = typeof body.pendingLogId === "string" ? body.pendingLogId : "";
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pendingLogId)) {
    return Response.json({ error: "Invalid job" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: pending, error } = await supabase
    .from("system_logs")
    .select("id,event,payload")
    .eq("id", pendingLogId)
    .eq("integration", "Meta WhatsApp")
    .maybeSingle();
  if (error) return Response.json({ error: "Queue unavailable" }, { status: 503 });
  if (!pending || pending.event !== "follow_up_pending") return Response.json({ skipped: true });

  const phone = typeof pending.payload?.phone === "string" ? pending.payload.phone : "";
  if (!/^91[6-9]\d{9}$/.test(phone)) return Response.json({ error: "Invalid recipient" }, { status: 400 });

  const { data: claimed } = await supabase
    .from("system_logs")
    .update({ event: "follow_up_processing", error: null })
    .eq("id", pending.id)
    .eq("event", "follow_up_pending")
    .select("id")
    .maybeSingle();
  if (!claimed) return Response.json({ skipped: true });

  try {
    const result = await sendShareFollowUp(phone);
    await supabase.from("system_logs").update({
      event: "follow_up_sent",
      payload: { ...pending.payload, whatsapp_message_id: result.messages?.[0]?.id || null },
    }).eq("id", pending.id);
    return Response.json({ sent: true });
  } catch (sendError) {
    const errorMessage = sendError instanceof Error ? sendError.message : "Unknown error";
    await supabase.from("system_logs").update({ event: "follow_up_pending", error: errorMessage.slice(0, 500) }).eq("id", pending.id);
    await writeSystemLog("follow_up_send_failed", { pending_log_id: pending.id }, errorMessage);
    return Response.json({ error: "Delivery failed" }, { status: 503 });
  }
}
