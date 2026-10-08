"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegistrationActions({ id, type }: { id: string; type: "camp" | "regular" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function update(field: string, value: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/${type}-registrations`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [field]: value }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update registration.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update registration."); }
    finally { setBusy(false); }
  }

  return <div className="table-actions"><select disabled={busy} defaultValue="" aria-label="Update registration" onChange={event => { const [field, value] = event.target.value.split(":"); if (field) update(field, value); event.target.value = ""; }}><option value="">Update…</option><option value="confirmation_status:Confirmed">Confirm</option><option value="confirmation_status:Pending">Mark pending</option>{type === "camp" ? <><option value="attendance_status:Attended">Mark attended</option><option value="attendance_status:No-show">Mark no-show</option></> : <><option value="registration_status:Appointment Booked">Mark booked</option><option value="registration_status:Cancelled">Cancel request</option></>}</select>{error && <small role="alert" className="admin-action-error">{error}</small>}</div>;
}
