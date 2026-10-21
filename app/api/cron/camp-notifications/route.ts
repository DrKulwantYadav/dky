import { campDatabase } from "@/lib/camps/server";
import { processCampNotification } from "@/lib/camps/notifications";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const db = campDatabase();
  if (!db) return new Response("Unavailable", { status: 503 });
  const { data, error } = await db.rpc("list_due_camp_notification_jobs", { p_limit: 20 });
  if (error || !Array.isArray(data)) return new Response("Unavailable", { status: 503 });
  const results = await Promise.all(data.map((jobId: string) => processCampNotification(jobId)));
  return Response.json({ processed: results.filter(result => result === "sent").length,
    remaining: results.filter(result => result === "failed" || result === "unavailable").length });
}
