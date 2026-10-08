import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Initiative = {
  id: string; title: string; slug: string; summary: string; purpose: string; highlights: string;
  topic: string; status: "Draft" | "Upcoming" | "Completed" | "Archived";
  start_date: string | null; end_date: string | null; venue: string;
  cover_media_id: string | null; original_campaign_url: string | null; registration_url: string | null;
  appointment_url: string; seo_title: string | null; seo_description: string | null;
  is_published: boolean; published_at: string | null; created_at: string; updated_at: string;
};
export type InitiativeMedia = {
  id: string; initiative_id: string; public_id: string; secure_url: string;
  resource_type: "image" | "video" | "raw"; width: number | null; height: number | null;
  format: string | null; bytes: number | null; caption: string; alt_text: string;
  group_label: string; sort_order: number; is_cover: boolean; created_at: string;
};
export type InitiativeService = { id: string; initiative_id: string; title: string; description: string; is_delivered: boolean; sort_order: number };
export type InitiativeStatistic = { id: string; initiative_id: string; label: string; value: string; is_public: boolean; sort_order: number };
export type InitiativeCoverage = { id: string; initiative_id: string; coverage_type: "Newspaper Clipping" | "Online Article" | "Video" | "Social Update"; publication_name: string; headline: string; published_date: string | null; source_url: string | null; media_id: string | null; summary: string; sort_order: number; created_at: string };
export type InitiativeDetail = Initiative & { media: InitiativeMedia[]; services: InitiativeService[]; statistics: InitiativeStatistic[]; coverage: InitiativeCoverage[] };

async function bounded<T>(query: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(query),
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("Community content is temporarily unavailable.")), 8000); }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

export async function listInitiatives(publishedOnly = true): Promise<Initiative[]> {
  const supabase = await createClient();
  let query = supabase.from("community_initiatives").select("*").order("start_date", { ascending: false, nullsFirst: false });
  if (publishedOnly) query = query.eq("is_published", true);
  const { data, error } = await bounded(query);
  if (error) throw error;
  return (data || []) as Initiative[];
}

export async function getInitiative(slug: string, includeDraft = false): Promise<InitiativeDetail | null> {
  const supabase = await createClient();
  let query = supabase.from("community_initiatives").select("*").eq("slug", slug);
  if (!includeDraft) query = query.eq("is_published", true);
  const { data: item, error } = await bounded(query.maybeSingle());
  if (error) throw error;
  if (!item) return null;
  const [media, services, statistics, coverage] = await Promise.all([
    bounded(supabase.from("initiative_media").select("*").eq("initiative_id", item.id).order("sort_order")),
    bounded(supabase.from("initiative_services").select("*").eq("initiative_id", item.id).order("sort_order")),
    bounded(supabase.from("initiative_statistics").select("*").eq("initiative_id", item.id).order("sort_order")),
    bounded(supabase.from("initiative_coverage").select("*").eq("initiative_id", item.id).order("sort_order")),
  ]);
  for (const result of [media, services, statistics, coverage]) if (result.error) throw result.error;
  return { ...(item as Initiative), media: (media.data || []) as InitiativeMedia[], services: (services.data || []) as InitiativeService[], statistics: (statistics.data || []) as InitiativeStatistic[], coverage: (coverage.data || []) as InitiativeCoverage[] };
}

export function cloudinaryImage(publicId: string, width: number, crop = false) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud || !publicId) return "";
  const transformation = `f_auto,q_auto,w_${width}${crop ? ",h_" + Math.round(width * .67) + ",c_fill,g_auto" : ",c_limit"}`;
  return `https://res.cloudinary.com/${encodeURIComponent(cloud)}/image/upload/${transformation}/${publicId.split("/").map(encodeURIComponent).join("/")}`;
}

export function displayDate(start: string | null, end: string | null) {
  if (!start) return "Date to be confirmed";
  const format = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return end && end !== start ? `${format(start)} – ${format(end)}` : format(start);
}

export function safeAppointmentUrl(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/book-appointment";
}
