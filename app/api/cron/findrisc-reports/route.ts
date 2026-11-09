import { processDueFindriscReports } from "@/lib/findrisc/delivery";
import { FINDRISC_EMAIL_REPORTS_ENABLED } from "@/lib/findrisc/email-feature";

export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!FINDRISC_EMAIL_REPORTS_ENABLED) return new Response("Email reports are disabled", { status: 410 });
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  try {
    const result = await processDueFindriscReports(10);
    return Response.json(result, { status: result.available ? 200 : 503,
      headers: { "Cache-Control": "no-store" } });
  } catch { return new Response("Unavailable", { status: 503 }); }
}
