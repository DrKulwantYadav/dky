import { createClient } from "@supabase/supabase-js";
import { supabaseAdminConfig } from "./config";

export function createSupabaseAdmin() {
  const { url, serviceRoleKey } = supabaseAdminConfig();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function writeSystemLog(
  event: string,
  payload: Record<string, unknown>,
  error?: string,
) {
  const supabase = createSupabaseAdmin();
  await supabase.from("system_logs").insert({
    integration: "Meta WhatsApp",
    event,
    payload,
    error: error?.slice(0, 500) || null,
  });
}
