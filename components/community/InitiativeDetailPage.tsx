import Image from "next/image";
import Link from "next/link";
import type { InitiativeDetail, InitiativeMedia } from "@/lib/community";
import { cloudinaryImage, displayDate, safeAppointmentUrl } from "@/lib/community";
import CommunityHeader from "./CommunityHeader";
import CommunityRichText from "./CommunityRichText";
import Gallery, { type GalleryItem } from "./Gallery";
import SiteFooter from "@/app/SiteFooter";
import JsonLd from "@/app/JsonLd";
import cloudinaryLoader from "@/lib/cloudinary-loader";
import { breadcrumbSchema, siteUrl } from "@/app/seo";

export default function InitiativeDetailPage({ item, preview = false }: { item: InitiativeDetail; preview?: boolean }) {
  const path = `/community-initiatives/${item.slug}`;
  const imageUrl = (media: InitiativeMedia, width: number, crop = false) => media.public_id.startsWith("static:") ? media.secure_url : cloudinaryImage(media.public_id, width, crop);
  const dateLabel = "dateLabel" in item && typeof item.dateLabel === "string" ? item.dateLabel : displayDate(item.start_date, item.end_date);
  const mediaById = new Map(item.media.map(m => [m.id, m]));
  const cover = item.cover_media_id ? mediaById.get(item.cover_media_id) : item.media.find(x => x.is_cover && x.resource_type === "image");
  const gallery: GalleryItem[] = item.media.filter(x => (x.resource_type === "image" || x.resource_type === "video") && !x.public_id.includes("/coverage/")).map(x => ({
    id: x.id, src: x.resource_type === "image" ? imageUrl(x, 900) : "",
    full: x.resource_type === "image" ? imageUrl(x, 2000) : "",
    poster: x.resource_type === "image" ? imageUrl(x, 640, true) : videoPoster(x),
    alt: x.alt_text, caption: x.caption, group: x.group_label, video: x.resource_type === "video", videoUrl: x.secure_url,
  }));
  const eventSchema = !preview && item.start_date && item.venue && ["Upcoming", "Completed"].includes(item.status) ? {
    "@context": "https://schema.org", "@type": "Event", name: item.title, description: item.summary,
    startDate: item.start_date, endDate: item.end_date || item.start_date,
    eventStatus: item.status === "Completed" ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: item.venue, address: { "@type": "PostalAddress", addressLocality: "Bhiwadi", addressRegion: "Rajasthan", addressCountry: "IN" } },
    url: `${siteUrl}${path}`,
    ...(cover ? { image: [imageUrl(cover, 1200)] } : {}),
  } : null;
  return <main className="community-page">
    {!preview && <JsonLd data={[breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Community activities", path: "/community-initiatives" }, { name: item.title, path }]), ...(eventSchema ? [eventSchema] : [])]}/>}
    <CommunityHeader/>
    {preview && <div className="community-preview-banner">Admin preview · This draft is visible only to authorised administrators.</div>}
    <section className="community-detail-hero"><div className="community-detail-copy"><Link className="community-back" href="/community-initiatives">← Community activities</Link><p className="eyebrow"><span/> {item.topic || "Community health"}</p><h1>{item.title}</h1><span className={`community-badge inline ${item.status.toLowerCase()}`}>{item.status}</span><p className="community-detail-summary">{item.summary}</p><dl><div><dt>Date</dt><dd>{dateLabel}</dd></div><div><dt>Venue</dt><dd>{item.venue || "Venue to be confirmed"}</dd></div></dl>{item.status === "Upcoming" && item.registration_url && <a className="primary-button" href={item.registration_url}>Register for this initiative →</a>}</div><div className="community-detail-cover">{cover ? <Image src={imageUrl(cover, 1400)} alt={cover.alt_text || item.title} width={1400} height={980} sizes="(max-width: 900px) 100vw, 50vw" loader={cover.public_id.startsWith("static:") ? undefined : cloudinaryLoader} priority/> : <div className="community-image-placeholder"><span>KY</span><small>Community health</small></div>}</div></section>
    <div className="community-detail-content">
      {item.purpose && <section className="community-prose-section"><p className="community-kicker">01 / Why we gathered</p><h2>Purpose</h2><CommunityRichText value={item.purpose}/></section>}
      {item.services.some(x => x.is_delivered) && <section className="community-prose-section"><p className="community-kicker">02 / Care delivered</p><h2>Services provided</h2><div className="community-services">{item.services.filter(x => x.is_delivered).map(x => <article key={x.id}><h3>{x.title}</h3>{x.description && <p>{x.description}</p>}</article>)}</div></section>}
      {(item.highlights || item.statistics.some(x => x.is_public)) && <section className="community-prose-section"><p className="community-kicker">03 / From the camp</p><h2>Camp highlights</h2>{item.highlights && <CommunityRichText value={item.highlights}/>}<div className="community-statistics">{item.statistics.filter(x => x.is_public).map(x => <div key={x.id}><strong>{x.value}</strong><span>{x.label}</span></div>)}</div></section>}
      {gallery.length > 0 && <section className="community-prose-section"><p className="community-kicker">04 / In pictures</p><h2>Photo &amp; video gallery</h2><Gallery items={gallery}/></section>}
      {item.coverage.length > 0 && <section className="community-prose-section"><p className="community-kicker">05 / In the news</p><h2>Media coverage</h2><div className="community-coverage-grid">{item.coverage.map(x => { const media = x.media_id ? mediaById.get(x.media_id) : null; const href = x.source_url || media?.secure_url; return <article key={x.id} className="community-coverage-card">{media?.resource_type === "image" ? <Image src={imageUrl(media, 580, true)} alt={media.alt_text || x.headline} width={580} height={380} sizes="(max-width: 700px) 100vw, 33vw" loader={media.public_id.startsWith("static:") ? undefined : cloudinaryLoader} loading="lazy"/> : media?.resource_type === "video" ? <Image src={videoPoster(media)} alt={media.alt_text || x.headline} width={580} height={380} unoptimized loading="lazy"/> : <div className="community-coverage-placeholder" aria-hidden="true"><span>KY</span><small>{x.coverage_type}</small></div>}<div><span className="community-coverage-type">{x.coverage_type === "Social Update" ? "Social Updates" : x.coverage_type}</span><p className="community-coverage-source">{x.publication_name}{x.published_date && <> · {displayDate(x.published_date, null)}</>}</p><h3>{x.headline}</h3>{x.summary && <p>{x.summary}</p>}{href && <a href={href} target="_blank" rel="noopener noreferrer">{x.coverage_type === "Newspaper Clipping" ? "View Clipping" : x.coverage_type === "Online Article" ? "Read Coverage" : x.coverage_type === "Social Update" ? "View Social Update" : "Watch Video"} ↗</a>}</div></article>; })}</div></section>}
      {item.original_campaign_url && <aside className="community-original"><div><strong>Original campaign page</strong><p>See the information published for this camp.</p></div><a href={item.original_campaign_url} target="_blank" rel="noopener noreferrer">View Original Camp Information ↗</a></aside>}
    </div>
    <section className="community-final-cta"><p>Continue your care</p><h2>Need ongoing medical care?</h2><span>For ongoing medical care, book a consultation with Dr. Kulwant Yadav.</span><Link className="primary-button" href={safeAppointmentUrl(item.appointment_url)}>Book a Regular Appointment <span>→</span></Link></section>
    <SiteFooter/>
  </main>;
}

function videoPoster(media: InitiativeMedia) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return cloud ? `https://res.cloudinary.com/${encodeURIComponent(cloud)}/video/upload/so_0,w_640,c_limit,f_jpg,q_auto/${media.public_id.split("/").map(encodeURIComponent).join("/")}.jpg` : "";
}
