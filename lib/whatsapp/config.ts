const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
};

export function whatsappConfig() {
  return {
    appSecret: required("META_APP_SECRET"),
    verifyToken: required("WHATSAPP_VERIFY_TOKEN"),
    accessToken: required("WHATSAPP_ACCESS_TOKEN"),
    phoneNumberId: required("WHATSAPP_PHONE_NUMBER_ID"),
    graphVersion: process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v23.0",
  };
}

export function supabaseAdminConfig() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
