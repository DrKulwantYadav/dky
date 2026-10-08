import { NextResponse } from "next/server";
import { z } from "zod";
import { communityAdmin, sameOrigin, apiError, refreshCommunity } from "@/lib/community-admin";
import { verifyUploadResponse, destroyCloudinary } from "@/lib/community-cloudinary";

const upload = z.object({
  public_id: z.string().min(1), secure_url: z.string().url(), resource_type: z.enum(["image", "video", "raw"]),
  width: z.number().int().nonnegative().nullable(), height: z.number().int().nonnegative().nullable(),
  format: z.string().nullable(), bytes: z.number().int().nonnegative().nullable(),
  version: z.number().int(), signature: z.string().regex(/^[a-f0-9]{40}$/),
  caption: z.string().max(1000).default(""), alt_text: z.string().max(500).default(""),
  group_label: z.string().max(160).default(""), sort_order: z.number().int().default(0),
  is_cover: z.boolean().default(false),
});
const edit = z.object({ id: z.string().uuid(), caption: z.string().max(1000), alt_text: z.string().max(500), group_label: z.string().max(160), sort_order: z.number().int(), is_cover: z.boolean() });
type Context = { params: Promise<{ id: string }> };

async function context(request: Request, params: Context["params"]) {
  const access = await communityAdmin();
  if (access.error) return { error: access.error };
  if (!sameOrigin(request)) return { error: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) };
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return { error: NextResponse.json({ error: "Invalid initiative." }, { status: 400 }) };
  const { data: item } = await access.supabase!.from("community_initiatives").select("slug").eq("id", id).maybeSingle();
  if (!item) return { error: NextResponse.json({ error: "Initiative not found." }, { status: 404 }) };
  return { ...access, id, slug: item.slug };
}

export async function POST(request: Request, { params }: Context) {
  const access = await context(request, params);
  if (access.error) return access.error;
  const parsed = upload.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid Cloudinary upload response." }, { status: 400 });
  const { version, signature, ...values } = parsed.data;
  if (!values.public_id.startsWith(`dr-kulwant/community-initiatives/${access.slug}/`) ||
      !verifyUploadResponse(values.public_id, version, signature) ||
      !values.secure_url.startsWith(`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${values.resource_type}/upload/`))
    return NextResponse.json({ error: "The uploaded file could not be verified." }, { status: 400 });
  const { data, error } = await access.supabase!.from("initiative_media").insert({ ...values, initiative_id: access.id }).select("*").single();
  if (error) return apiError(error);
  if (values.is_cover && values.resource_type === "image") await access.supabase!.from("community_initiatives").update({ cover_media_id: data.id }).eq("id", access.id);
  refreshCommunity(access.slug);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request, { params }: Context) {
  const access = await context(request, params);
  if (access.error) return access.error;
  const parsed = edit.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid media details." }, { status: 400 });
  const { id, ...values } = parsed.data;
  const s = access.supabase!;
  const { data: media } = await s.from("initiative_media").select("resource_type").eq("id", id).eq("initiative_id", access.id).maybeSingle();
  if (!media) return NextResponse.json({ error: "Media item not found." }, { status: 404 });
  if (values.is_cover && media.resource_type !== "image") return NextResponse.json({ error: "Only images can be covers." }, { status: 400 });
  if (values.is_cover) await s.from("initiative_media").update({ is_cover: false }).eq("initiative_id", access.id).neq("id", id);
  const { error } = await s.from("initiative_media").update(values).eq("id", id).eq("initiative_id", access.id);
  if (error) return apiError(error);
  refreshCommunity(access.slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const access = await context(request, params);
  if (access.error) return access.error;
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid media item." }, { status: 400 });
  const s = access.supabase!;
  const { data: media } = await s.from("initiative_media").select("public_id,resource_type").eq("id", parsed.data.id).eq("initiative_id", access.id).maybeSingle();
  if (!media) return NextResponse.json({ error: "Media item not found." }, { status: 404 });
  const { data: initiative } = await s.from("community_initiatives").select("cover_media_id,is_published").eq("id", access.id).single();
  if (initiative?.is_published && initiative.cover_media_id === parsed.data.id) return NextResponse.json({ error: "Choose another cover image or unpublish before deleting the current cover." }, { status: 400 });
  try { await destroyCloudinary(media.public_id, media.resource_type); }
  catch (error) { return apiError(error, "Cloudinary could not delete the file. The media record was kept."); }
  const { error } = await s.from("initiative_media").delete().eq("id", parsed.data.id).eq("initiative_id", access.id);
  if (error) return apiError(error, "Cloudinary removed the file, but the database record could not be removed. Please retry.");
  refreshCommunity(access.slug);
  return NextResponse.json({ ok: true });
}
