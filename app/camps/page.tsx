import type { Metadata } from "next";
import SiteFooter from "../SiteFooter";
import { pageMetadata } from "../seo";
import CampHeader from "./CampHeader";
import CampListing from "./CampListing";
import "./camps.css";

export const metadata: Metadata = pageMetadata({ title: "Health Camps", description: "View upcoming health camps with Dr. Kulwant Yadav in Bhiwadi and register for an available arrival window.", path: "/camps" });

export default function CampsPage() {
  return <main className="camps-page"><CampHeader /><section className="camps-hero"><p className="eyebrow"><span /> Community health, made accessible</p><h1>Health <em>camps.</em></h1><p>Explore current and upcoming health camps. Choose a camp to see its schedule, venue and registration availability.</p></section><CampListing /><SiteFooter /></main>;
}
