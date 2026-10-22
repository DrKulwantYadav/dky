"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import "./fibroscan-popup.css";

const slug = "fibroscan-camp-oct-29";
const campUrl = `https://www.drkulwantyadav.com/camps/${slug}`;
const expiresAt = new Date("2026-10-31T00:00:00+05:30").getTime();

export default function FibroscanCampPopup() {
  const [visible, setVisible] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);

  useEffect(() => {
    if (Date.now() >= expiresAt) return;
    const timer = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const remaining = expiresAt - Date.now();
    const timer = window.setTimeout(() => setVisible(false), Math.max(0, remaining));
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { setVisible(false); return; }
      if (event.key !== "Tab" || !dialog.current) return;
      const controls = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]")];
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [visible]);

  if (!visible) return null;
  return <div className="fibroscan-popup-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setVisible(false); }}>
    <section ref={dialog} className="fibroscan-popup" role="dialog" aria-modal="true" aria-labelledby="fibroscan-popup-title" aria-describedby="fibroscan-popup-description">
      <button ref={closeButton} type="button" className="fibroscan-popup-close" onClick={() => setVisible(false)} aria-label="Close FibroScan camp announcement">×</button>
      <div className="fibroscan-popup-portrait"><Image src="/dr-kulwant-yadav-portrait.png" alt="Dr. Kulwant Yadav" width={520} height={650} sizes="(max-width: 700px) 100vw, 360px"/><span>Dr. Kulwant Yadav<small>Consultant Internal Medicine</small></span></div>
      <div className="fibroscan-popup-content"><p className="fibroscan-popup-eyebrow">Health camp · Bhiwadi</p>
        <h2 id="fibroscan-popup-title">October FibroScan health camp</h2>
        <p id="fibroscan-popup-description">Join us at Gopinath Hospital for the October FibroScan health camp.</p>
        <dl className="fibroscan-popup-details"><div><dt>Date</dt><dd>29 October 2026</dd></div><div><dt>Time</dt><dd>11:00 am – 2:00 pm IST</dd></div><div><dt>Location</dt><dd>Gopinath Hospital, Bhiwadi</dd></div></dl>
        <a className="fibroscan-popup-link" href={campUrl}>View camp details <span aria-hidden="true">→</span></a>
      </div>
    </section>
  </div>;
}
