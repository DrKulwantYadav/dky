"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ImportRegistrations({ type }: { type: "camp" | "regular" }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setMessage(""); setError(false);
    const formData = new FormData(); formData.set("file", file); formData.set("type", type);
    try {
      const response = await fetch("/api/admin/import", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Import failed.");
      setMessage(`${result.imported} registration${result.imported === 1 ? "" : "s"} imported successfully.`);
      router.refresh();
    } catch (uploadError) {
      setError(true); setMessage(uploadError instanceof Error ? uploadError.message : "Import failed.");
    } finally { setUploading(false); event.target.value = ""; }
  }

  return <div className="admin-import-control">
    <input ref={input} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={upload} disabled={uploading} />
    <button className="admin-secondary-button" type="button" title="Required columns: Name and Phone or Mobile" onClick={() => input.current?.click()} disabled={uploading}>{uploading ? "Importing…" : "Import CSV / Excel"}</button>
    <small>Columns: Name + Phone/Mobile</small>
    {message && <span className={error ? "error" : "success"} role="status">{message}</span>}
  </div>;
}
