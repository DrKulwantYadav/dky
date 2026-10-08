import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { getInitiative } from "@/lib/community";
import CommunityEditor from "@/components/admin/CommunityEditor";
import "../community-admin.css";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin.profile.role === "staff") notFound();
  const { id } = await params;
  const s = await createClient();
  const { data } = await s.from("community_initiatives").select("slug").eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = await getInitiative(data.slug, true);
  if (!item) notFound();
  return <CommunityEditor initial={item}/>;
}
