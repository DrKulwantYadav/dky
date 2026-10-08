"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AppointmentForm from "@/app/book-appointment/AppointmentForm";

export default function AppointmentModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedPath, setOpenedPath] = useState("");
  const opener = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const visible = open && openedPath === pathname;

  useEffect(() => {
    function intercept(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (pathname === "/world-heart-day-free-ecg-camp" || pathname === "/book-appointment") return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!anchor || anchor.hasAttribute("download") || (anchor instanceof HTMLAnchorElement && anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.getAttribute("href") || "", window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/book-appointment") return;
      event.preventDefault();
      opener.current = anchor as HTMLElement;
      setOpenedPath(pathname);
      setOpen(true);
    }
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab" || !dialog.current) return;
      const controls = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); opener.current?.focus(); };
  }, [visible]);

  if (!visible) return null;
  return <div className="appointment-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
    <section ref={dialog} className="appointment-modal" role="dialog" aria-modal="true" aria-label="Request an appointment">
      <button ref={closeButton} className="appointment-modal-close" type="button" onClick={() => setOpen(false)} aria-label="Close appointment form">×</button>
      <AppointmentForm/>
    </section>
  </div>;
}
