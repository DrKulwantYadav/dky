import { NextResponse } from "next/server";
import { z } from "zod";
import { communityAdmin, sameOrigin, refreshCommunity, apiError } from "@/lib/community-admin";
import { destroyCloudinary } from "@/lib/community-cloudinary";

const uuid = z.string().uuid();
const optionalUrl = z.union([z.literal(""), z.string().url().refine(v => v.startsWith("https://"))]).nullable();
const itemSchema = z.object({
  title: z.string().trim().min(3).max(180), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().max(2000), purpose: z.string().max(20000), highlights: z.string().max(30000),
  topic: z.string().trim().max(100), status: z.enum(["Draft", "Upcoming", "Completed", "Archived"]),
  start_date: z.string().date().nullable(), end_date: z.string().date().nullable(), venue: z.string().max(300),
  cover_media_id: uuid.nullable(), original_campaign_url: optionalUrl,
  registration_url: z.union([z.literal(""), z.string().regex(/^\/(?!\/)[^\s]*$/), z.string().url().refine(v => v.startsWith("https://"))]).nullable(),
  appointment_url: z.string().regex(/^\/(?!\/)[^\s]*$/), seo_title: z.string().max(180).nullable(),
  seo_description: z.string().max(500).nullable(), is_published: z.boolean(),
  services: z.array(z.object({ id: uuid.optional(), title: z.string().trim().min(1), description: z.string().max(2000), is_delivered: z.boolean(), sort_order: z.number().int() })).max(100),
  statistics: z.array(z.object({ id: uuid.optional(), label: z.string().trim().min(1), value: z.string().trim().min(1), is_public: z.boolean(), sort_order: z.number().int() })).max(100),
  coverage: z.array(z.object({ id: uuid.optional(), coverage_type: z.enum(["Newspaper Clipping", "Online Article", "Video", "Social Update"]), publication_name: z.string().trim().min(1), headline: z.string().trim().min(1), published_date: z.string().date().nullable(), source_url: optionalUrl, media_id: uuid.nullable(), summary: z.string().max(2000), sort_order: z.number().int() })).max(100),
}).refine(v => !v.end_date || !v.start_date || v.end_date >= v.start_date, "End date must follow start date.")
  .refine(v => !v.is_published || (["Upcoming", "Completed"].includes(v.status) && !!v.start_date && !!v.venue.trim() && !!v.summary.trim()), "Publishing requires an upcoming or completed status, verified start date, venue and summary.")
  .refine(v => !v.is_published || v.status !== "Upcoming" || !!v.registration_url, "Upcoming initiatives require a registration URL before publishing.")
  .refine(v => !v.is_published || !!v.cover_media_id, "Add a cover image before publishing.");

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const access = await communityAdmin();
  if (access.error) return access.error;
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { id } = await params;
  if (!uuid.safeParse(id).success) return NextResponse.json({ error: "Invalid initiative." }, { status: 400 });
  const parsed = itemSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(x => x.message).join(" ") }, { status: 400 });
  const s = access.supabase!;
  const { data: old } = await s.from("community_initiatives").select("slug,published_at").eq("id", id).maybeSingle();
  if (!old) return NextResponse.json({ error: "Initiative not found." }, { status: 404 });
  const { services, statistics, coverage, ...values } = parsed.data;
  if (old.slug !== values.slug) {
    const { count } = await s.from("initiative_media").select("id", { count: "exact", head: true }).eq("initiative_id", id);
    if (count) return NextResponse.json({ error: "Remove this initiative’s Cloudinary media before changing its URL slug, so uploads stay in the correct folder." }, { status: 400 });
  }
  if (values.cover_media_id) {
    const { data: cover } = await s.from("initiative_media").select("id,resource_type,alt_text").eq("id", values.cover_media_id).eq("initiative_id", id).maybeSingle();
    if (!cover || cover.resource_type !== "image") return NextResponse.json({ error: "Select a cover image from this initiative." }, { status: 400 });
    if (values.is_published && !cover.alt_text.trim()) return NextResponse.json({ error: "Add meaningful alt text to the cover image before publishing." }, { status: 400 });
  }
  if (coverage.some(x => x.media_id)) {
    const ids = [...new Set(coverage.map(x => x.media_id).filter((x): x is string => !!x))];
    const { data: media } = await s.from("initiative_media").select("id").eq("initiative_id", id).in("id", ids);
    if (media?.length !== ids.length) return NextResponse.json({ error: "Coverage files must belong to this initiative." }, { status: 400 });
  }
  const { error } = await s.from("community_initiatives").update({ ...values, published_at: values.is_published ? old.published_at || new Date().toISOString() : null }).eq("id", id);
  if (error) return apiError(error);
  try {
    for (const [table, rows] of [["initiative_services", services], ["initiative_statistics", statistics], ["initiative_coverage", coverage]] as const) {
      const { data: existing, error: readError } = await s.from(table).select("id").eq("initiative_id", id);
      if (readError) throw readError;
      const existingIds = new Set((existing || []).map(x => x.id));
      for (const row of rows) if (row.id && !existingIds.has(row.id)) throw new Error("One of the edited entries no longer belongs to this initiative. Refresh and try again.");
      const retained = rows.map(x => x.id).filter(Boolean);
      const removed = [...existingIds].filter(x => !retained.includes(x));
      if (rows.length) {
        const { error: writeError } = await s.from(table).upsert(rows.map(x => ({ ...x, initiative_id: id })));
        if (writeError) throw writeError;
      }
      if (removed.length) {
        const { error: removeError } = await s.from(table).delete().eq("initiative_id", id).in("id", removed);
        if (removeError) throw removeError;
      }
    }
  } catch (e) { return apiError(e, "Some sections could not be saved. Refresh before trying again."); }
  refreshCommunity(old.slug, values.slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const access = await communityAdmin();
  if (access.error) return access.error;
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { id } = await params;
  if (!uuid.safeParse(id).success) return NextResponse.json({ error: "Invalid initiative." }, { status: 400 });
  const s = access.supabase!;
  const { data: item } = await s.from("community_initiatives").select("slug").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "Initiative not found." }, { status: 404 });
  const { data: files, error: listError } = await s.from("initiative_media").select("public_id,resource_type").eq("initiative_id", id);
  if (listError) return apiError(listError);
  try { for (const file of files || []) await destroyCloudinary(file.public_id, file.resource_type); }
  catch (error) { return apiError(error, "Could not remove a Cloudinary file. The initiative was kept."); }
  const { error } = await s.from("community_initiatives").delete().eq("id", id);
  if (error) return apiError(error, "Files were removed from Cloudinary, but database cleanup failed. Contact the site administrator.");
  refreshCommunity(item.slug);
  return NextResponse.json({ ok: true });
}
