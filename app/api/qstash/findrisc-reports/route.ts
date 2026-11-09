import { Receiver } from "@upstash/qstash";
import { processFindriscReport } from "@/lib/findrisc/delivery";
import { FINDRISC_EMAIL_REPORTS_ENABLED } from "@/lib/findrisc/email-feature";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!FINDRISC_EMAIL_REPORTS_ENABLED) return new Response("Email reports are disabled", { status: 410 });
  if (Number(request.headers.get("content-length") || 0) > 1000) return new Response("Payload too large", { status: 413 });
  const body = await request.text();
  if (Buffer.byteLength(body) > 1000) return new Response("Payload too large", { status: 413 });
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const next = process.env.QSTASH_NEXT_SIGNING_KEY;
  const destination = process.env.QSTASH_FINDRISC_REPORT_URL;
  const signature = request.headers.get("upstash-signature");
  if (!current || !next || !destination) return new Response("Unavailable", { status: 503 });
  if (!signature) return new Response("Unauthorized", { status: 401 });
  try {
    const receiver = new Receiver({ currentSigningKey: current, nextSigningKey: next });
    if (!await receiver.verify({ signature, body, url: destination,
      upstashRegion: request.headers.get("upstash-region") || undefined }))
      return new Response("Unauthorized", { status: 401 });
  } catch { return new Response("Unauthorized", { status: 401 }); }
  let id = "";
  try { const parsed = JSON.parse(body) as { id?: unknown }; id = typeof parsed.id === "string" ? parsed.id : ""; }
  catch { return new Response("Invalid payload", { status: 400 }); }
  const result = await processFindriscReport(id);
  // QStash retries pending and temporarily unavailable jobs. A finished job is a no-op.
  return Response.json({ result }, { status: result === "pending" || result === "unavailable" ? 503 : 200 });
}
