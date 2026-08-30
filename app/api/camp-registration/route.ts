import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowedRelationships = new Set(["self", "parent", "sibling", "other"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const age = Number(body.age);
    const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
    const registrationFor = typeof body.registrationFor === "string" ? body.registrationFor : "";

    if (body.website) return NextResponse.json({ ok: true });
    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 });
    if (!Number.isInteger(age) || age < 1 || age > 120) return NextResponse.json({ error: "Please enter a valid age." }, { status: 400 });
    if (!/^[0-9+ ()-]{10,18}$/.test(mobile)) return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    if (!allowedRelationships.has(registrationFor)) return NextResponse.json({ error: "Please select who the check-up is for." }, { status: 400 });
    if (body.consent !== "on") return NextResponse.json({ error: "Consent is required to complete registration." }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Online registration is temporarily unavailable. Please use WhatsApp." }, { status: 503 });

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.from("camp_registrations").insert({ name, age, mobile, registration_for: registrationFor });

    if (error) {
      console.error("Camp registration insert failed", error.code);
      return NextResponse.json({ error: "Online registration is temporarily unavailable. Please use WhatsApp." }, { status: 503 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration could not be completed. Please check the details and try again." }, { status: 400 });
  }
}
