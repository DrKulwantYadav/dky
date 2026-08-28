import type { MetadataRoute } from "next";
import { conditionProfiles } from "./conditions/data";
import { libraryTopics } from "./health-library/data";
import { serviceProfiles } from "./services/data";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://drkulwantyadav.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/about-dr-kulwant-yadav`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/book-appointment`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/clinic-bhiwadi`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/conditions`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/health-library`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/world-heart-day-free-ecg-camp`, changeFrequency: "yearly", priority: 0.85 },
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

  return [...staticPages, ...conditionPages, ...servicePages, ...articlePages];
}
