import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { parseAdminCamp } from "@/lib/camps/admin-schema";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_admin_camps");
  if (error) return NextResponse.json({ error: "Camp administration requires the reusable camps migration." }, { status: 503 });
  return NextResponse.json({ camps: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return NextResponse.json({ error: "Administrator permission required." }, { status: 403 });
  const { config, errors } = parseAdminCamp(await request.json().catch(() => null));
  if (!config || config.id) return NextResponse.json({ error: errors[0] || "New camps cannot include an ID." }, { status: 400 });
  const supabase = await createClient();
  const readiness = await supabase.rpc("camp_token_format_ready");
  if (readiness.error || readiness.data !== true) return NextResponse.json({ error: "Apply the short camp tokens migration before saving camps." }, { status: 503 });
  const { data, error } = await supabase.rpc("save_admin_camp", { p_config: config });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That camp URL slug is already used." : error.code === "42883" ? "Camp administration migration is not applied." : error.message }, { status: error.code === "42883" ? 503 : 400 });
  return NextResponse.json({ id: data }, { status: 201 });
}
