"use client";
import { useState } from "react";

export default function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  if (state === "done") return <p role="status">You have been unsubscribed from clinic marketing emails.</p>;
  return <div><button disabled={state === "saving"} onClick={async () => {
    setState("saving");
    try {
      const response = await fetch(`/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`, { method: "POST" });
      setState(response.ok ? "done" : "error");
    } catch { setState("error"); }
  }}>Unsubscribe</button>{state === "error" && <p role="alert">We could not save this request. Please try again.</p>}</div>;
}
