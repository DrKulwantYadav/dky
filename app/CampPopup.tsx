"use client";

import { useEffect, useRef, useState } from "react";

const campPage = "/world-heart-day-free-ecg-camp";
const campDates = [
  { day: "06", endsAt: "2026-09-06T13:00:00+05:30" },
  { day: "13", endsAt: "2026-09-13T13:00:00+05:30" },
  { day: "20", endsAt: "2026-09-20T13:00:00+05:30" },
  { day: "27", endsAt: "2026-09-27T13:00:00+05:30" },
];

export default function CampPopup() {
  const [open, setOpen] = useState(true);
  const [now, setNow] = useState<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const nextCamp = now === null ? null : campDates.find((camp) => now <= new Date(camp.endsAt).getTime());

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open || !nextCamp) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, nextCamp]);

  if (!open || !nextCamp) return null;

  const registrationLink = `https://wa.me/919205775932?text=I%20would%20like%20to%20register%20for%20the%20free%20ECG%20and%20heart%20check-up%20camp%20on%20${nextCamp.day}%20September%202026.`;

  return <div className="camp-popup-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) setOpen(false);
  }}>
    <section className="camp-popup" role="dialog" aria-modal="true" aria-labelledby="camp-popup-title" aria-describedby="camp-popup-description">
      <button ref={closeButton} className="camp-popup-close" type="button" onClick={() => setOpen(false)} aria-label="Close free ECG camp announcement">×</button>
      <div className="camp-popup-photo">
        <img src="/dr-kulwant-yadav-portrait.png" alt="Dr. Kulwant Yadav, Consultant Internal Medicine"/>
        <div className="camp-popup-doctor">
          <svg viewBox="0 0 240 44" role="img" aria-label="Heartbeat line"><path d="M0 24h52l10-13 13 27 15-36 18 42 14-20h118"/></svg>
          <span>Dr. Kulwant Yadav</span>
        </div>
      </div>
      <div className="camp-popup-copy">
        <p>Free camp · September 2026</p>
        <h2 id="camp-popup-title">Free ECG &amp;<br/>Heart Check-up Camp</h2>
        <div className="camp-popup-next-date" aria-label={`Next camp is Sunday ${nextCamp.day} September`}><small>Next camp</small><strong>Sunday</strong><span>{nextCamp.day}</span><b>September</b></div>
        <p id="camp-popup-description">9:00 am–1:00 pm at Gopinath Hospital, Bhiwadi. Prior registration is recommended.</p>
        <div className="camp-popup-actions">
          <a href={campPage}>View camp details</a>
          <a href={registrationLink} target="_blank" rel="noopener noreferrer">Register free ↗</a>
        </div>
      </div>
    </section>
  </div>;
}
