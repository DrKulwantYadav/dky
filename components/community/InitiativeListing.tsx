"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import cloudinaryLoader from "@/lib/cloudinary-loader";

export type ListingItem = { id: string; title: string; slug: string; summary: string; topic: string; status: string; date: string; year: string; venue: string; cover: string; alt: string; registration: string };

export default function InitiativeListing({ items }: { items: ListingItem[] }) {
  const [year, setYear] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const years = [...new Set(items.map(x => x.year).filter(Boolean))].sort().reverse();
  const topics = [...new Set(items.map(x => x.topic).filter(Boolean))].sort();
  const visible = items.filter(x => (!year || x.year === year) && (!topic || x.topic === topic) && (!status || x.status === status));
  const upcoming = visible.filter(x => x.status === "Upcoming");
  const past = visible.filter(x => x.status === "Completed");
  return <>
    <form className="community-filters" onSubmit={e => e.preventDefault()} aria-label="Filter community activities">
      <label>Year<select value={year} onChange={e => setYear(e.target.value)}><option value="">All years</option>{years.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Health topic<select value={topic} onChange={e => setTopic(e.target.value)}><option value="">All topics</option>{topics.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option>Upcoming</option><option>Completed</option></select></label>
      <button type="button" onClick={() => { setYear(""); setTopic(""); setStatus(""); }}>Clear filters</button>
    </form>
    {!visible.length ? <div className="community-empty"><span aria-hidden="true">✦</span><h2>No activities found</h2><p>Try another year, topic, or status. New community activities will appear here when published.</p></div> : <>
      {upcoming.length > 0 && <section className="community-list-section"><div className="community-section-head"><span>What&apos;s ahead</span><h2>Upcoming initiatives</h2></div><div className="community-card-grid">{upcoming.map(item => <Card key={item.id} item={item}/>)}</div></section>}
      {past.length > 0 && <section className="community-list-section"><div className="community-section-head"><span>From the community</span><h2>Past initiatives</h2></div><div className="community-card-grid">{past.map(item => <Card key={item.id} item={item}/>)}</div></section>}
    </>}
  </>;
}

function Card({ item }: { item: ListingItem }) {
  return <article className="community-card">
    <Link href={`/community-initiatives/${item.slug}`} className="community-card-image" aria-label={`View ${item.title}`}>
      {item.cover ? <Image src={item.cover} alt={item.alt || item.title} width={720} height={480} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" loader={item.cover.startsWith("/") ? undefined : cloudinaryLoader} loading="lazy"/> : <div className="community-image-placeholder" aria-hidden="true"><span>KY</span><small>Community health</small></div>}
      <span className={`community-badge ${item.status.toLowerCase()}`}>{item.status}</span>
    </Link>
    <div className="community-card-body"><p className="community-topic">{item.topic}</p><h3><Link href={`/community-initiatives/${item.slug}`}>{item.title}</Link></h3><p className="community-meta">{item.date}<br/>{item.venue}</p><p>{item.summary}</p><div className="community-card-actions"><Link href={`/community-initiatives/${item.slug}`}>{item.status === "Upcoming" ? "View initiative" : "View camp highlights"} <span aria-hidden="true">→</span></Link>{item.status === "Upcoming" && item.registration && <a href={item.registration}>Register interest <span aria-hidden="true">↗</span></a>}</div></div>
  </article>;
}
