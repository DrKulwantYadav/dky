"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DigestRetryButton({ deliveryId, kind = "staff" }: { deliveryId: string; kind?: "staff" | "patient" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function retry() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(kind === "patient" ? "/api/admin/regular-patient-reminders/retry" : "/api/admin/regular-digest/retry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Retry was not confirmed.");
      }
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Retry was not confirmed."); }
    finally { setBusy(false); }
  }
  return <><button type="button" disabled={busy} onClick={() => void retry()}>{busy ? "Retrying…" : "Retry delivery"}</button>{error && <small role="alert">{error}</small>}</>;
}
