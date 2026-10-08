import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { getInitiative } from "@/lib/community";
import InitiativeDetailPage from "@/components/community/InitiativeDetailPage";
import "@/app/community-initiatives/community.css";

export const metadata: Metadata = { title: "Admin initiative preview", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin.profile.role === "staff") notFound();
  const { id } = await params;
  const s = await createClient();
  const { data } = await s.from("community_initiatives").select("slug").eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = await getInitiative(data.slug, true);
  if (!item) notFound();
  return <InitiativeDetailPage item={item} preview/>;
}
