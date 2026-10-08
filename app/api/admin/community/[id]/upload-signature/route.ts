import { NextResponse } from "next/server";
import { z } from "zod";
import { communityAdmin, sameOrigin, apiError } from "@/lib/community-admin";
import { uploadSignature } from "@/lib/community-cloudinary";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await communityAdmin();
  if (access.error) return access.error;
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid initiative." }, { status: 400 });
  const parsed = z.object({ kind: z.enum(["gallery", "coverage", "covers"]) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload category." }, { status: 400 });
  const { data } = await access.supabase!.from("community_initiatives").select("slug").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Initiative not found." }, { status: 404 });
  try { return NextResponse.json(uploadSignature(data.slug, parsed.data.kind)); }
  catch (error) { return apiError(error); }
}
