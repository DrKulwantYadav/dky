import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const relationships = new Set(["self", "parent", "spouse", "family"]);
const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 4096) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const body = await request.json();
    // Quietly discard basic bot submissions without storing or firing lead events.
    if (body.website) return NextResponse.json({ ok: true, accepted: false });
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    const age = Number(body.age);
    const mobile = typeof body.mobile === "string" ? body.mobile.replace(/\D/g, "").replace(/^91(?=[6-9]\d{9}$)/, "") : "";
    const registrationFor = typeof body.registrationFor === "string" ? body.registrationFor : "";

    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Please enter a valid full name." }, { status: 400 });
    if (!Number.isInteger(age) || age < 18 || age > 120) return NextResponse.json({ error: "This campaign registration is for adults aged 18 or above." }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(mobile)) return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
    if (!relationships.has(registrationFor)) return NextResponse.json({ error: "Please select who you are registering for." }, { status: 400 });
    if (body.consent !== "on") return NextResponse.json({ error: "Please agree to be contacted about this screening." }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Online registration is temporarily unavailable. Please use WhatsApp." }, { status: 503 });

    const attribution = Object.fromEntries(attributionKeys.flatMap((key) => {
      const value = body[key];
      return typeof value === "string" && value.length <= 150 ? [[key, value]] : [];
    }));
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.rpc("submit_public_thyroid_registration", {
      p_full_name: name,
      p_age: age,
      p_phone: mobile,
      p_registration_for: registrationFor,
      p_attribution: attribution,
    });
    if (error) {
      console.error("Thyroid registration failed", error.code);
      return NextResponse.json({ error: "Registration could not be saved. Please use WhatsApp or call the hospital." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, accepted: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
  }
}
