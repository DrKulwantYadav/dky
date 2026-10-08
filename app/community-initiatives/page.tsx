import type { Metadata } from "next";
import { listInitiatives, getInitiative, cloudinaryImage, displayDate } from "@/lib/community";
import { isStaticInitiative, staticInitiatives } from "@/lib/community-static";
import { pageMetadata, breadcrumbSchema } from "@/app/seo";
import JsonLd from "@/app/JsonLd";
import SiteFooter from "@/app/SiteFooter";
import CommunityHeader from "@/components/community/CommunityHeader";
import InitiativeListing from "@/components/community/InitiativeListing";
import "./community.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({ title: "Health Camps & Community Activities", description: "Explore Dr. Kulwant Yadav's health camps, screening initiatives and community activities in Bhiwadi.", path: "/community-initiatives" });

export default async function CommunityPage() {
  let initiatives = [] as Awaited<ReturnType<typeof listInitiatives>>;
  try { initiatives = (await listInitiatives()).filter(x => x.status === "Upcoming" || x.status === "Completed"); }
  catch { /* Static community content remains available without Supabase. */ }
  const publishedSlugs = new Set(initiatives.map(x => x.slug));
  const allInitiatives = [...initiatives, ...staticInitiatives.filter(x => !publishedSlugs.has(x.slug))];
  const coverDetails = await Promise.all(allInitiatives.map(async x => { if (isStaticInitiative(x)) return x; try { return await getInitiative(x.slug); } catch { return null; } }));
  const items = allInitiatives.map((x, i) => {
    const detail = coverDetails[i];
    const cover = detail?.media.find(m => m.id === x.cover_media_id) || detail?.media.find(m => m.is_cover && m.resource_type === "image");
    return { id: x.id, title: x.title, slug: x.slug, summary: x.summary, topic: x.topic, status: x.status,
      date: isStaticInitiative(x) ? x.dateLabel : displayDate(x.start_date, x.end_date), year: isStaticInitiative(x) ? x.yearLabel : x.start_date?.slice(0, 4) || "", venue: x.venue,
      cover: cover ? cover.public_id.startsWith("static:") ? cover.secure_url : cloudinaryImage(cover.public_id, 760, true) : "", alt: cover?.alt_text || x.title,
      registration: x.registration_url || "" };
  });
  return <main className="community-page"><JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Community activities", path: "/community-initiatives" }])}/><CommunityHeader/><section className="community-index-hero"><p className="eyebrow"><span/> Beyond the consultation room</p><h1>Health Camps &amp;<br/><em>Community Activities</em></h1><p>Beyond the consultation room, Dr. Kulwant Yadav’s community initiatives bring health awareness, screening and medical guidance closer to people in Bhiwadi.</p></section><div className="community-index-body"><InitiativeListing items={items}/></div><SiteFooter/></main>;
}
