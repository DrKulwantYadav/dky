import { NextResponse } from "next/server";
import { createSupabaseAdmin, writeSystemLog } from "@/lib/whatsapp/supabase";
import { sendShareFollowUp } from "@/lib/whatsapp/messages";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data: pending, error } = await supabase
    .from("system_logs")
    .select("id,payload")
    .eq("integration", "Meta WhatsApp")
    .eq("event", "follow_up_pending")
    .lte("payload->>due_at", new Date().toISOString())
    .order("created_at")
    .limit(50);
  if (error) return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });

  let sent = 0;
  for (const item of pending || []) {
    const phone = typeof item.payload?.phone === "string" ? item.payload.phone : "";
    if (!phone) continue;
    const { data: claimed } = await supabase.from("system_logs").update({ event: "follow_up_processing" }).eq("id", item.id).eq("event", "follow_up_pending").select("id").maybeSingle();
    if (!claimed) continue;
    try {
      const result = await sendShareFollowUp(phone);
      await supabase.from("system_logs").update({ event: "follow_up_sent", payload: { ...item.payload, whatsapp_message_id: result.messages?.[0]?.id || null } }).eq("id", item.id);
      sent += 1;
    } catch (sendError) {
      await supabase.from("system_logs").update({ event: "follow_up_failed", error: sendError instanceof Error ? sendError.message.slice(0, 500) : "Unknown error" }).eq("id", item.id);
      await writeSystemLog("follow_up_send_failed", { pending_log_id: item.id, phone }, sendError instanceof Error ? sendError.message : "Unknown error");
    }
  }
  return NextResponse.json({ processed: pending?.length || 0, sent });
}
