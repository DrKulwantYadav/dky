import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

const reasons = ["Diabetes", "Blood pressure", "Fatty liver", "Weight management", "Fever or infection", "Respiratory problem", "Digestive problem", "Headache", "Seizure follow-up", "Kidney-related concern", "Report review", "Other medical concern"] as const;

const schema = z.object({
  patientName: z.string().trim().min(2).max(120),
  mobile: z.string().regex(/^(?:\+?91[-\s]?)?[6-9]\d{9}$/),
  email: z.union([z.literal(""), z.email().max(254)]),
  ageGroup: z.enum(["18–29 years", "30–44 years", "45–59 years", "60–74 years", "75 years or above"]),
  patientType: z.enum(["New patient", "Follow-up patient"]),
  slotId: z.uuid(),
  reason: z.enum(reasons),
  consent: z.literal(true),
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 4096) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please check all required fields and try again." }, { status: 400 });
    const values = parsed.data;
    if (values.website) return NextResponse.json({ ok: true, accepted: false });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Online requests are temporarily unavailable. Please call or WhatsApp the clinic." }, { status: 503 });

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc("book_public_appointment_slot", {
      p_slot_id: values.slotId,
      p_full_name: values.patientName,
      p_phone: values.mobile.replace(/\D/g, "").replace(/^91(?=[6-9]\d{9}$)/, ""),
      p_email: values.email,
      p_age_group: values.ageGroup,
      p_patient_type: values.patientType,
      p_reason: values.reason,
      p_consent: values.consent,
    });
    if (error || !data) {
      console.error("Appointment request save failed", error?.code || "empty_response");
      if (error?.code === "P0002") return NextResponse.json({ error: "This time is no longer available. Please choose another slot." }, { status: 409 });
      return NextResponse.json({ error: "Your request could not be saved. Please call or WhatsApp the clinic instead." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, accepted: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
  }
}
