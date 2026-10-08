import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!z.iso.date().safeParse(date).success) return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });
  const todayIndia = Date.now() + 330 * 60_000;
  const earliest = new Date(todayIndia).toISOString().slice(0, 10);
  const latest = new Date(todayIndia + 365 * 86_400_000).toISOString().slice(0, 10);
  if (!date || date < earliest || date > latest) return NextResponse.json({ slots: [] }, { headers: { "Cache-Control": "no-store" } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Appointment times are temporarily unavailable." }, { status: 503 });

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc("list_public_appointment_slots", { p_date: date });
    if (error) {
      console.error("Appointment availability lookup failed", error.code);
      return NextResponse.json({ error: "Appointment times could not be loaded. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ slots: (data || []).map((slot: { slot_id: string; start_time: string }) => ({ id: slot.slot_id, startTime: slot.start_time })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Appointment times could not be loaded. Please try again." }, { status: 503 });
  }
}
