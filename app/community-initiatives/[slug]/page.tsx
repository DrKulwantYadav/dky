import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInitiative } from "@/lib/community";
import { staticInitiative } from "@/lib/community-static";
import { pageMetadata } from "@/app/seo";
import InitiativeDetailPage from "@/components/community/InitiativeDetailPage";
import "../community.css";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getInitiative(slug).catch(() => null) || staticInitiative(slug);
  if (!item) return { title: "Community initiative unavailable", robots: { index: false, follow: false } };
  const metadata = pageMetadata({ title: item.seo_title || item.title, description: item.seo_description || item.summary, path: `/community-initiatives/${slug}` });
  return item.seo_title ? { ...metadata, title: { absolute: item.seo_title } } : metadata;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const item = await getInitiative(slug).catch(() => null) || staticInitiative(slug);
  if (!item) notFound();
  return <InitiativeDetailPage item={item}/>;
}
