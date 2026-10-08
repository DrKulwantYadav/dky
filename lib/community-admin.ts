import "server-only";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function communityAdmin() {
  const admin = await getAdmin();
  if (!admin) return { error: NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 }) };
  if (admin.profile.role === "staff") return { error: NextResponse.json({ error: "Administrator access is required." }, { status: 403 }) };
  return { admin, supabase: await createClient() };
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === request.headers.get("host"); } catch { return false; }
}

export function refreshCommunity(...slugs: (string | null | undefined)[]) {
  revalidatePath("/community-initiatives");
  for (const slug of slugs) if (slug) revalidatePath(`/community-initiatives/${slug}`);
  revalidatePath("/sitemap.xml");
}

export function apiError(error: unknown, fallback = "Could not save this initiative.") {
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: 400 });
}
