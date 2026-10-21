"use client";

import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import MetaPixel from "@/components/MetaPixel";

export default function SiteAnalytics() {
  const pathname = usePathname();

  // Camp pages include a health-related registration form. Do not load ad or
  // analytics scripts there, including on a direct visit from an advertisement.
  if (pathname === "/camps" || pathname.startsWith("/camps/")) return null;

  return <><GoogleAnalytics gaId="G-B0Y32VYD07" /><MetaPixel /></>;
}
