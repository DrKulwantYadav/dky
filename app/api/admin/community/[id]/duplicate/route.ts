import { NextResponse } from "next/server";
import { z } from "zod";
import { communityAdmin, sameOrigin, apiError } from "@/lib/community-admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await communityAdmin();
  if (access.error) return access.error;
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid initiative." }, { status: 400 });
  const s = access.supabase!;
  const { data: original, error: lookupError } = await s.from("community_initiatives").select("*").eq("id", id).maybeSingle();
  if (lookupError || !original) return NextResponse.json({ error: "Initiative not found." }, { status: 404 });
  const { data: sibling } = await s.from("community_initiatives").select("id").eq("slug", `${original.slug}-copy`).maybeSingle();
  const slug = sibling ? `${original.slug}-copy-${Date.now().toString(36)}` : `${original.slug}-copy`;
  const { id: _id, created_at: _created, updated_at: _updated, published_at: _published, ...copy } = original;
  void _id; void _created; void _updated; void _published;
  const { data: created, error } = await s.from("community_initiatives").insert({ ...copy, title: `${original.title} (copy)`, slug, status: "Draft", is_published: false, published_at: null, cover_media_id: null, created_by: access.admin!.user.id }).select("id,slug").single();
  if (error) return apiError(error);
  for (const table of ["initiative_services", "initiative_statistics"] as const) {
    const { data: rows } = await s.from(table).select("*").eq("initiative_id", id);
    if (rows?.length) {
      const { error: childError } = await s.from(table).insert(rows.map(({ id: _rowId, initiative_id: _parentId, ...row }) => { void _rowId; void _parentId; return { ...row, initiative_id: created.id }; }));
      if (childError) return apiError(childError, "Draft was created, but some details did not copy. Open the draft to review it.");
    }
  }
  return NextResponse.json({ ...created, note: "Text and service details copied. Add media to the new draft before publishing." }, { status: 201 });
}
