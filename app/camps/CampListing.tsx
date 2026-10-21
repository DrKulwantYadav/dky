"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CampListResponse, CampSummary } from "@/lib/camps/contracts";
import { campDateRange } from "@/lib/camps/format";

export default function CampListing() {
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/camps", { cache: "no-store", signal });
      if (!response.ok) throw new Error("Camp information is temporarily unavailable.");
      const result: CampListResponse = await response.json();
      if (!Array.isArray(result.camps)) throw new Error("Invalid camp response.");
      setCamps(result.camps);
      setState("ready");
    } catch {
      if (!signal?.aborted) setState("error");
    }
  }, []);

  useEffect(() => { const controller = new AbortController(); void Promise.resolve().then(() => load(controller.signal)); return () => controller.abort(); }, [load]);

  return <section className="camps-list" aria-labelledby="camps-list-title">
    <div className="camps-section-heading"><p className="section-label"><span>01</span> Find a camp</p><h2 id="camps-list-title">Available camps</h2></div>
    {state === "loading" && <p className="camps-state" role="status">Loading camps…</p>}
    {state === "error" && <div className="camps-state" role="alert"><p>Camp information could not be loaded. Please try again.</p><button type="button" onClick={() => { setState("loading"); void load(); }}>Retry</button></div>}
    {state === "ready" && camps.length === 0 && <div className="camps-state"><h3>No upcoming camps are published yet.</h3><p>Please check back for new dates. You can still request a regular appointment.</p><a href="/book-appointment">Book a regular appointment →</a></div>}
    {state === "ready" && camps.length > 0 && <div className="camps-grid">{camps.map(camp => <article className="camp-card" key={camp.id}>
      {camp.imageUrl && <Image src={camp.imageUrl} alt="" width={800} height={500} unoptimized />}
      <div className="camp-card-body"><span className={`camp-status camp-status-${camp.status}`}>{camp.status === "open" ? "Registration open" : camp.status === "upcoming" ? "Coming soon" : camp.status === "full" ? "Fully booked" : "Registration closed"}</span><h3>{camp.title}</h3><p>{camp.description}</p><dl><div><dt>Venue</dt><dd>{camp.venueName}, {camp.venueAddress}</dd></div><div><dt>Dates</dt><dd>{campDateRange(camp.firstSessionDate, camp.lastSessionDate)}</dd></div></dl><Link href={`/camps/${encodeURIComponent(camp.slug)}`}>{camp.status === "open" ? "View camp & register" : "View camp"} <span aria-hidden="true">→</span></Link></div>
    </article>)}</div>}
  </section>;
}
