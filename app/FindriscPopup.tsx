"use client";

import { useEffect, useRef, useState } from "react";
import "./findrisc-popup.css";

export default function FindriscPopup() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { const timer = window.setTimeout(() => setOpen(true), 350); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab" || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]")];
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keydown); previousFocus?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className="findrisc-popup-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
    <section ref={dialog} className="findrisc-popup" role="dialog" aria-modal="true" aria-labelledby="findrisc-popup-title" aria-describedby="findrisc-popup-description">
      <button ref={close} type="button" className="findrisc-popup-close" onClick={() => setOpen(false)} aria-label="Close diabetes risk test invitation">×</button>
      <div className="findrisc-popup-panel">
        <div className="findrisc-popup-brand"><span className="findrisc-popup-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></div>
        <p className="findrisc-popup-panel-title">A clearer starting point.</p>
        <div className="findrisc-popup-panel-facts"><div><strong>08</strong><span>FINDRISC questions</span></div><div><strong>10</strong><span>year risk estimate</span></div></div>
        <p className="findrisc-popup-panel-foot">See your score after saving.</p>
      </div>
      <div className="findrisc-popup-content">
        <div className="findrisc-popup-mobile-brand"><span className="findrisc-popup-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></div>
        <p className="findrisc-popup-eyebrow">Free adult screening tool</p>
        <h2 id="findrisc-popup-title">Know your diabetes risk.</h2>
        <p id="findrisc-popup-description">Take the 8-question FINDRISC (Finnish Diabetes Risk Score) test. Answer on one page, then provide your contact details to see your score and request clinic follow-up.</p>
        <p className="findrisc-popup-mobile-facts">8 questions <span aria-hidden="true">·</span> 10-year risk estimate</p>
        <ul className="findrisc-popup-benefits"><li>Answer eight simple questions on one page.</li><li>See your risk score after your request is saved.</li><li>Clinic staff can follow up with your consent.</li></ul>
        <button type="button" className="findrisc-popup-link" onClick={() => window.location.assign("/conditions/diabetes?assessment=1")}>Get my FINDRISC score <span aria-hidden="true">→</span></button>
        <p className="findrisc-popup-note">For adults without diagnosed diabetes. The result is an estimate, not a diagnosis.</p>
        <button type="button" className="findrisc-popup-later" onClick={() => setOpen(false)}>Maybe later</button>
      </div>
    </section>
  </div>;
}
