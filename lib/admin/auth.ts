import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "super_admin" | "admin" | "staff";

export const getAdmin = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (!profile) return null;
  return { user, profile: profile as { id: string; full_name: string; role: AdminRole; active: boolean } };
});

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
