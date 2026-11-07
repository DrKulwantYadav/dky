import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findriscAnswersSchema, scoreFindrisc } from "@/lib/findrisc";
import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";

export const runtime = "nodejs";

const bodySchema = z.object({
  submissionKey: z.uuid(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^(?:[6-9]\d{9})?$/),
  email: z.union([z.literal(""), z.email().max(254)]),
  consent: z.literal(true),
  answers: findriscAnswersSchema,
}).strict().refine(value => Boolean(value.phone || value.email), { message: "A phone number or email is required." });

const noStore = { "Cache-Control": "no-store" };
const failure = (status: number, message: string) => NextResponse.json({ error: message }, { status, headers: noStore });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 5000) return failure(413, "Request too large.");
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return failure(403, "Invalid request origin.");
  let raw: unknown;
  try { const text = await request.text(); if (Buffer.byteLength(text) > 5000) return failure(413, "Request too large."); raw = JSON.parse(text); }
  catch { return failure(400, "Invalid request."); }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return failure(400, "Check your name, contact, answers and consent.");
  const input = parsed.data;
  const result = scoreFindrisc(input.answers);
  const payloadHash = digest(JSON.stringify({ name: input.name, phone: input.phone, email: input.email.toLowerCase(), answers: input.answers }));
  let db: ReturnType<typeof createSupabaseAdmin>;
  try { db = createSupabaseAdmin(); } catch { return failure(503, "Follow-up requests are temporarily unavailable."); }

  // A replay of a committed request succeeds even if the client lost its first response.
  const existing = await db.from("findrisc_leads").select("payload_hash,score,risk_tier").eq("submission_key", input.submissionKey).maybeSingle();
  if (existing.error?.code === "PGRST205" || existing.error?.code === "42703")
    return failure(503, "Assessment service is not configured yet. Please try again later.");
  if (existing.error) return failure(503, "Could not confirm this request. Retry with the same details.");
  if (existing.data) return existing.data.payload_hash === payloadHash
    ? NextResponse.json({ status: "saved", score: existing.data.score, riskTier: existing.data.risk_tier }, { headers: noStore })
    : failure(409, "This request key was used with different details.");

  const secret = process.env.FINDRISC_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) return failure(503, "Follow-up requests are temporarily unavailable.");
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const contact = input.email ? input.email.toLowerCase() : input.phone;
  for (const [value, limit] of [[`ip:${ip}`, 20], [`contact:${contact}`, 5]] as const) {
    const key = digest(`${secret}:${value}`);
    const { data: allowed, error } = await db.rpc("consume_findrisc_rate_limit", { p_key_hash: key, p_limit: limit, p_window_seconds: 3600 });
    if (error) return failure(503, "Follow-up requests are temporarily unavailable.");
    if (!allowed) return failure(429, "Too many requests. Try again later.");
  }
  const { data: saved, error } = await db.from("findrisc_leads").insert({ submission_key: input.submissionKey,
    payload_hash: payloadHash, attendee_name: input.name, contact_phone: input.phone || null,
    contact_email: input.email ? input.email.toLowerCase() : null,
    answers: input.answers, score: result.total, risk_tier: result.tier }).select("id,score,risk_tier").single();
  if (error?.code === "23505") {
    const replay = await db.from("findrisc_leads").select("payload_hash,score,risk_tier").eq("submission_key", input.submissionKey).maybeSingle();
    if (!replay.error && replay.data?.payload_hash === payloadHash)
      return NextResponse.json({ status: "saved", score: replay.data.score, riskTier: replay.data.risk_tier }, { headers: noStore });
    if (!replay.error && replay.data) return failure(409, "This request key was used with different details.");
  }
  if (error?.code === "PGRST204" || error?.code === "42703")
    return failure(503, "Assessment database is not configured yet. Please try again later.");
  if (error) return failure(503, "Could not confirm this request. Retry with the same details.");
  // Future phase: enqueue an emailed report only after separate email consent is enabled.
  return NextResponse.json({ status: "saved", score: saved.score, riskTier: saved.risk_tier }, { headers: noStore });
}
