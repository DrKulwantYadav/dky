import type { MetadataRoute } from "next";
import { conditionProfiles } from "./conditions/data";
import { libraryTopics } from "./health-library/data";
import { serviceProfiles } from "./services/data";
import { createClient } from "@/lib/supabase/server";
import { staticInitiatives } from "@/lib/community-static";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://drkulwantyadav.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/about-dr-kulwant-yadav`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/book-appointment`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/clinic-bhiwadi`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/conditions`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/research`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteUrl}/health-library`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/world-heart-day-free-ecg-camp`, changeFrequency: "yearly", priority: 0.85 },
    { url: `${siteUrl}/community-initiatives`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/thyroid-screening-bhiwadi`, changeFrequency: "weekly", priority: 0.9 },
  ];

  const conditionPages: MetadataRoute.Sitemap = Object.keys(conditionProfiles).map((slug) => ({
    url: `${siteUrl}/conditions/${slug}`,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const servicePages: MetadataRoute.Sitemap = serviceProfiles.map(({ id }) => ({
    url: `${siteUrl}/services/${id}`,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const articlePages: MetadataRoute.Sitemap = libraryTopics.map(({ slug }) => ({
    url: `${siteUrl}/health-library/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  let communityPages: MetadataRoute.Sitemap = [];
  try {
    const s = await createClient();
    const { data } = await s.from("community_initiatives").select("slug,updated_at").eq("is_published", true).in("status", ["Upcoming", "Completed"]);
    communityPages = (data || []).map(x => ({ url: `${siteUrl}/community-initiatives/${x.slug}`, lastModified: x.updated_at, changeFrequency: "monthly", priority: 0.7 }));
  } catch { /* Keep static sitemap available if Supabase is unavailable. */ }
  const publishedSlugs = new Set(communityPages.map(page => page.url.split("/").at(-1)));
  communityPages.push(...staticInitiatives.filter(item => !publishedSlugs.has(item.slug)).map(item => ({ url: `${siteUrl}/community-initiatives/${item.slug}`, lastModified: item.updated_at, changeFrequency: "monthly" as const, priority: 0.7 })));
  return [...staticPages, ...conditionPages, ...servicePages, ...articlePages, ...communityPages];
}
