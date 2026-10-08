import { NextResponse } from "next/server";
import { z } from "zod";
import { communityAdmin, sameOrigin, refreshCommunity, apiError } from "@/lib/community-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await communityAdmin();
  if (access.error) return access.error;
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid initiative." }, { status: 400 });
  const parsed = z.object({ publish: z.boolean() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid publication request." }, { status: 400 });
  const s = access.supabase!;
  const { data: item } = await s.from("community_initiatives").select("slug,status,start_date,summary,venue,published_at,cover_media_id,registration_url").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "Initiative not found." }, { status: 404 });
  if (parsed.data.publish && (!["Upcoming", "Completed"].includes(item.status) || !item.start_date || !item.summary.trim() || !item.venue.trim()))
    return NextResponse.json({ error: "Add a verified start date, venue, summary and Upcoming or Completed status before publishing." }, { status: 400 });
  if (parsed.data.publish && item.status === "Upcoming" && !item.registration_url) return NextResponse.json({ error: "Add a registration URL before publishing an upcoming initiative." }, { status: 400 });
  if (parsed.data.publish) {
    const { data: cover } = item.cover_media_id ? await s.from("initiative_media").select("alt_text,resource_type").eq("id", item.cover_media_id).eq("initiative_id", id).maybeSingle() : { data: null };
    if (!cover || cover.resource_type !== "image" || !cover.alt_text.trim()) return NextResponse.json({ error: "Add a cover image with meaningful alt text before publishing." }, { status: 400 });
  }
  const { error } = await s.from("community_initiatives").update({ is_published: parsed.data.publish, published_at: parsed.data.publish ? item.published_at || new Date().toISOString() : null }).eq("id", id);
  if (error) return apiError(error);
  refreshCommunity(item.slug);
  return NextResponse.json({ ok: true });
}
