import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/whatsapp/supabase";

export async function POST(request: Request) {
  const token = z.uuid().safeParse(new URL(request.url).searchParams.get("token"));
  if (!token.success) return Response.json({ error: "Invalid unsubscribe link" }, { status: 400 });
  try {
    const db = createSupabaseAdmin();
    const result = await db.rpc("unsubscribe_marketing_email", { p_token: token.data });
    if (result.error) return Response.json({ error: "Please retry later." }, { status: 503 });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Please retry later." }, { status: 503 }); }
}
