import { NextResponse } from "next/server";
import { whatsappConfig } from "@/lib/whatsapp/config";
import { hasValidMetaSignature } from "@/lib/whatsapp/security";
import { processWebhook } from "@/lib/whatsapp/webhook";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 256_000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  let verifyToken: string;
  try { verifyToken = whatsappConfig().verifyToken; } catch { return new NextResponse("Unavailable", { status: 503 }); }
  if (mode === "subscribe" && token === verifyToken && challenge) return new NextResponse(challenge, { status: 200 });
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return new NextResponse("Payload too large", { status: 413 });
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) return new NextResponse("Payload too large", { status: 413 });

  let appSecret: string;
  try { appSecret = whatsappConfig().appSecret; } catch { return new NextResponse("Unavailable", { status: 503 }); }
  if (!hasValidMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    await processWebhook(payload);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
