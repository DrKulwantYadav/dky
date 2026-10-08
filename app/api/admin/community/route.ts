import { NextResponse } from "next/server";
import { z } from "zod";
import { communityAdmin, sameOrigin } from "@/lib/community-admin";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  const access = await communityAdmin();
  if (access.error) return access.error;
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const parsed = z.object({ title: z.string().trim().min(3).max(180), slug: z.string().regex(slugPattern) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a title and a lowercase URL slug." }, { status: 400 });
  const { data, error } = await access.supabase!.from("community_initiatives").insert({ ...parsed.data, created_by: access.admin!.user.id }).select("id,slug").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This URL slug is already in use." : error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
