import { Receiver } from "@upstash/qstash";
import { processCampNotification } from "@/lib/camps/notifications";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 2000) return new Response("Payload too large", { status: 413 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 2000) return new Response("Payload too large", { status: 413 });
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY, next = process.env.QSTASH_NEXT_SIGNING_KEY;
  const url = process.env.QSTASH_CAMP_NOTIFICATION_URL, signature = request.headers.get("upstash-signature");
  if (!current || !next || !url) return new Response("Unavailable", { status: 503 });
  if (!signature) return new Response("Unauthorized", { status: 401 });
  try {
    const receiver = new Receiver({ currentSigningKey: current, nextSigningKey: next });
    if (!await receiver.verify({ signature, body: raw, url, upstashRegion: request.headers.get("upstash-region") || undefined }))
      return new Response("Unauthorized", { status: 401 });
  } catch { return new Response("Unauthorized", { status: 401 }); }
  let jobId = "";
  try { const parsed = JSON.parse(raw) as { jobId?: unknown }; jobId = typeof parsed.jobId === "string" ? parsed.jobId : ""; }
  catch { return new Response("Invalid payload", { status: 400 }); }
  const result = await processCampNotification(jobId);
  return Response.json({ result }, { status: result === "unavailable" ? 503 : 200 });
}
