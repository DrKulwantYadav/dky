import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { parseRegistrationFile } from "@/lib/admin/registration-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.profile.role === "staff") return NextResponse.json({ error: "Only an Admin or Super Admin can import registrations." }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a CSV or Excel .xlsx file." }, { status: 400 });
    if (type !== "camp" && type !== "regular") return NextResponse.json({ error: "Invalid registration type." }, { status: 400 });
    if (type === "camp") return NextResponse.json({ error: "Camp imports cannot assign an arrival window or enforce capacity. Use the scheduled registration flow." }, { status: 409 });
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "The file must be 2 MB or smaller." }, { status: 400 });

    const imported = await parseRegistrationFile(file);
    const supabase = await createClient();
    const phones = imported.map(({ phone }) => phone);
    const { data: existing, error: existingError } = await supabase.from("patients").select("id,phone").in("phone", phones);
    if (existingError) throw new Error("Existing patient records could not be checked.");
    const existingPhones = new Set((existing || []).map(({ phone }) => phone));
    const newPatients = imported.filter(({ phone }) => !existingPhones.has(phone));
    const { error: patientError } = newPatients.length
      ? await supabase.from("patients").upsert(newPatients.map(({ name, phone }) => ({ full_name: name, phone })), { onConflict: "phone", ignoreDuplicates: true })
      : { error: null };
    if (patientError) {
      console.error("Registration import patient save failed", patientError);
      throw new Error(`Patient records could not be saved: ${patientError.message}`);
    }

    const { data: patients, error: patientLookupError } = await supabase.from("patients").select("id,phone").in("phone", phones);
    if (patientLookupError) {
      console.error("Registration import patient lookup failed", patientLookupError);
      throw new Error(`Patient records were saved but could not be matched: ${patientLookupError.message}`);
    }
    const patientByPhone = new Map((patients || []).map((patient) => [patient.phone, patient.id]));
    if (patientByPhone.size !== imported.length) throw new Error("Some patient records could not be matched after import.");

    const { error: registrationError } = await supabase.from("regular_registrations").insert(imported.map(({ phone }) => ({ patient_id: patientByPhone.get(phone), consultation_type: "Imported registration", registration_status: "New", source: "Other" })));
    if (registrationError) {
      console.error("Registration import registration save failed", registrationError);
      throw new Error(`Registration records could not be saved: ${registrationError.message}`);
    }

    await supabase.from("admin_activity_logs").insert({ admin_id: admin.user.id, action: "Regular registrations imported", metadata: { rows: imported.length, file: file.name } });
    return NextResponse.json({ ok: true, imported: imported.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The import could not be completed." }, { status: 400 });
  }
}
