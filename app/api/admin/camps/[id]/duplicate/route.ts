import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return NextResponse.json({ error: "Administrator permission required." }, { status: 403 });
  const { id } = await params;
  const parsed = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100) }).safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Choose a unique lowercase slug for the duplicate." }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("duplicate_admin_camp", { p_camp_id: id, p_slug: parsed.data.slug });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That slug is already used." : error.code === "42883" ? "Camp administration migration is not applied." : error.message }, { status: error.code === "42883" ? 503 : 400 });
  return NextResponse.json({ id: data }, { status: 201 });
}
