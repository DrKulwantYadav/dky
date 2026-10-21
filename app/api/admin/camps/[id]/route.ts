import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { parseAdminCamp } from "@/lib/camps/admin-schema";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid camp ID" }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_camp", { p_id: id });
  if (error) return NextResponse.json({ error: "Camp administration requires the reusable camps migration." }, { status: 503 });
  if (!data) return NextResponse.json({ error: "Camp not found." }, { status: 404 });
  if (!("tokenPrefix" in data)) return NextResponse.json({ error: "Apply the short camp tokens migration before editing camps." }, { status: 503 });
  return NextResponse.json({ camp: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request, { params }: Context) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return NextResponse.json({ error: "Administrator permission required." }, { status: 403 });
  const { id } = await params;
  const { config, errors } = parseAdminCamp(await request.json().catch(() => null));
  if (!config || config.id !== id) return NextResponse.json({ error: errors[0] || "Camp ID does not match." }, { status: 400 });
  const supabase = await createClient();
  const readiness = await supabase.rpc("camp_token_format_ready");
  if (readiness.error || readiness.data !== true) return NextResponse.json({ error: "Apply the short camp tokens migration before saving camps." }, { status: 503 });
  const { error } = await supabase.rpc("save_admin_camp", { p_config: config });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That camp URL slug is already used." : error.code === "42883" ? "Camp administration migration is not applied." : error.message }, { status: error.code === "42883" ? 503 : 400 });
  return NextResponse.json({ id });
}

export async function PATCH(_request: Request, { params }: Context) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return NextResponse.json({ error: "Administrator permission required." }, { status: 403 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid camp ID." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_admin_camp", { p_id: id });
  if (error) return NextResponse.json({ error: error.code === "42883" ? "Camp administration migration is not applied." : error.message }, { status: error.code === "42883" ? 503 : 400 });
  return NextResponse.json({ ok: true });
}
