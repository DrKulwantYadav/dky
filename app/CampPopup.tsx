"use client";

import { useEffect, useRef, useState } from "react";

const campPage = "/world-heart-day-free-ecg-camp";
const registrationLink = "https://wa.me/919205775932?text=I%20would%20like%20to%20register%20for%20the%20free%20ECG%20and%20heart%20check-up%20camp%20in%20September%202026.";

export default function CampPopup() {
  const [open, setOpen] = useState(true);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  if (!open) return null;

  return <div className="camp-popup-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) setOpen(false);
  }}>
    <section className="camp-popup" role="dialog" aria-modal="true" aria-labelledby="camp-popup-title" aria-describedby="camp-popup-description">
      <button ref={closeButton} className="camp-popup-close" type="button" onClick={() => setOpen(false)} aria-label="Close free ECG camp announcement">×</button>
      <div className="camp-popup-photo">
        <img src="/dr-kulwant-yadav-portrait.png" alt="Dr. Kulwant Yadav, Consultant Internal Medicine"/>
        <span>Dr. Kulwant Yadav</span>
      </div>
      <div className="camp-popup-copy">
        <p>September 2026 · Every Sunday</p>
        <h2 id="camp-popup-title">Free ECG &amp;<br/>Heart Check-up Camp</h2>
        <div className="camp-popup-dates" aria-label="Camp dates"><span>06</span><span>13</span><span>20</span><span>27</span></div>
        <p id="camp-popup-description">9:00 am–1:00 pm at Gopinath Hospital, Bhiwadi. Prior registration is recommended.</p>
        <div className="camp-popup-actions">
          <a href={campPage}>View camp details</a>
          <a href={registrationLink} target="_blank" rel="noopener noreferrer">Register free ↗</a>
        </div>
      </div>
    </section>
  </div>;
}
