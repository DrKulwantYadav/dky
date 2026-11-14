import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { sendRegularDigestDelivery } from "@/lib/regular-digest/delivery";

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role !== "admin" && admin.profile.role !== "super_admin")
    return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const parsed = z.object({ deliveryId: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid delivery" }, { status: 400 });
  const db = await createClient();
  const { data: delivery, error } = await db.from("regular_appointment_digest_deliveries")
    .select("id,digest_date,status,attempts,lease_until").eq("id", parsed.data.deliveryId).maybeSingle();
  if (error || !delivery) return Response.json({ error: "Delivery unavailable" }, { status: 404 });
  const { data: run, error: runError } = await db.from("regular_appointment_digest_runs")
    .select("cutoff_at").eq("digest_date", delivery.digest_date).maybeSingle();
  if (runError || !run) return Response.json({ error: "Digest snapshot unavailable" }, { status: 503 });
  if (delivery.status !== "failed")
    return Response.json({ error: "Only definite failures can be retried. Reconcile uncertain sends in Gmail Sent first." }, { status: 409 });
  if (delivery.attempts >= 5 || Date.now() - Date.parse(run.cutoff_at) >= 23 * 3600_000)
    return Response.json({ error: "The retry window has closed." }, { status: 409 });
  const audit = await db.from("admin_activity_logs").insert({ admin_id: admin.user.id,
    action: "Regular digest delivery retry requested", metadata: { delivery_id: delivery.id } });
  if (audit.error) return Response.json({ error: "Could not audit the retry request." }, { status: 503 });
  const result = await sendRegularDigestDelivery(delivery.id);
  return result === "sent" ? Response.json({ status: result })
    : Response.json({ error: result === "uncertain" ? "Delivery result is uncertain; check Gmail Sent before another attempt." : "Delivery was not confirmed; review its status." },
      { status: result === "skipped" ? 409 : 503 });
}
