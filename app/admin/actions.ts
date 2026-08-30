"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("email not confirmed")) {
      redirect("/admin/login?error=email_not_confirmed");
    }

    if (message.includes("rate limit") || error.status === 429) {
      redirect("/admin/login?error=rate_limited");
    }

    if (message.includes("fetch") || message.includes("network")) {
      redirect("/admin/login?error=connection_failed");
    }

    redirect("/admin/login?error=invalid_credentials");
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("admin_profiles").select("active").eq("id", user?.id || "").maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=This%20account%20does%20not%20have%20admin%20access");
  }
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
