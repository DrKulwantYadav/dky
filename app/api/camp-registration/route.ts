import { NextResponse } from "next/server";

// The September 2026 registration form has been retired. New initiatives link to
// their own admin-supplied registration URL rather than this legacy endpoint.
export async function POST() {
  return NextResponse.json({ error: "This camp has concluded. Please book a regular appointment or view community activities." }, { status: 410 });
}
