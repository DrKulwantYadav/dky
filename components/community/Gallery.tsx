"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import cloudinaryLoader from "@/lib/cloudinary-loader";

export type GalleryItem = { id: string; src: string; full: string; poster: string; alt: string; caption: string; group: string; video: boolean; videoUrl: string };

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const open = active !== null;
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setActive(null); setPlaying(false); }
      if (event.key === "ArrowRight") { setActive(i => i === null ? null : (i + 1) % items.length); setPlaying(false); }
      if (event.key === "ArrowLeft") { setActive(i => i === null ? null : (i - 1 + items.length) % items.length); setPlaying(false); }
      if (event.key === "Tab") {
        const controls = Array.from(document.querySelectorAll<HTMLButtonElement>(".community-lightbox button"));
        if (controls.length && event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
        else if (controls.length && !event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keydown); opener.current?.focus(); };
  }, [open, items.length]);
  const groups = [...new Set(items.map(x => x.group || "Camp highlights"))];
  return <>
    {groups.map(group => <div key={group} className="community-gallery-group"><h3>{group}</h3><div className="community-gallery-grid">{items.map((item, index) => item.group === group || (!item.group && group === "Camp highlights") ? <button type="button" key={item.id} className="community-gallery-tile" onClick={event => { opener.current = event.currentTarget; setActive(index); setPlaying(false); }} aria-label={`Open ${item.video ? "video" : "photo"}: ${item.alt || item.caption || group}`}>
      {item.poster ? <Image src={item.poster} alt={item.alt || item.caption || group} width={640} height={430} sizes="(max-width: 700px) 100vw, 33vw" loader={item.video || item.poster.startsWith("/") ? undefined : cloudinaryLoader} unoptimized={item.video} loading="lazy"/> : <span className="community-video-placeholder">Video</span>}
      {item.video && <span className="community-play" aria-hidden="true">▶</span>}{item.caption && <span className="community-gallery-caption">{item.caption}</span>}
    </button> : null)}</div></div>)}
    {active !== null && <div className="community-lightbox" role="dialog" aria-modal="true" aria-label="Camp gallery viewer" onMouseDown={event => { if (event.target === event.currentTarget) { setActive(null); setPlaying(false); } }}>
      <button type="button" className="community-lightbox-close" ref={closeButton} onClick={() => { setActive(null); setPlaying(false); }} aria-label="Close gallery">×</button>
      <button type="button" className="community-lightbox-prev" onClick={() => { setActive((active - 1 + items.length) % items.length); setPlaying(false); }} aria-label="Previous media">‹</button>
      <figure>{items[active].video ? playing ? <video src={items[active].videoUrl} controls autoPlay playsInline poster={items[active].poster}/> : <button type="button" className="community-video-start" onClick={() => setPlaying(true)}>{items[active].poster && <Image src={items[active].poster} alt={items[active].alt} width={1200} height={800} unoptimized/>}<span>Play video</span></button> : <Image src={items[active].full} alt={items[active].alt || items[active].caption} width={1600} height={1100} sizes="100vw" loader={items[active].full.startsWith("/") ? undefined : cloudinaryLoader}/>}<figcaption>{items[active].caption || items[active].alt}<small>{active + 1} / {items.length}</small></figcaption></figure>
      <button type="button" className="community-lightbox-next" onClick={() => { setActive((active + 1) % items.length); setPlaying(false); }} aria-label="Next media">›</button>
    </div>}
  </>;
}
