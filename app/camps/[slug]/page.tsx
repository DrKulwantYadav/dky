import type { Metadata } from "next";
import SiteFooter from "@/app/SiteFooter";
import CampHeader from "../CampHeader";
import CampDetailView from "./CampDetailView";
import "../camps.css";

export const metadata: Metadata = { title: "Health Camp | Dr. Kulwant Yadav", robots: { index: false, follow: true } };

export default async function CampPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <main className="camps-page"><CampHeader /><CampDetailView slug={slug} /><SiteFooter /></main>;
}
