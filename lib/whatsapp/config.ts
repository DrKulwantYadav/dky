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

export function qstashConfig() {
  const destinationUrl = qstashDestinationUrl();
  return {
    token: required("QSTASH_TOKEN"),
    destinationUrl,
  };
}

function qstashDestinationUrl() {
  const destinationUrl = required("QSTASH_FOLLOW_UP_URL");
  const parsed = new URL(destinationUrl);
  if (parsed.protocol !== "https:" || parsed.pathname !== "/api/qstash/whatsapp-follow-up") {
    throw new Error("QSTASH_FOLLOW_UP_URL must be the HTTPS WhatsApp follow-up endpoint");
  }
  return parsed.toString();
}

export function qstashReceiverConfig() {
  return {
    currentSigningKey: required("QSTASH_CURRENT_SIGNING_KEY"),
    nextSigningKey: required("QSTASH_NEXT_SIGNING_KEY"),
    destinationUrl: qstashDestinationUrl(),
  };
}
