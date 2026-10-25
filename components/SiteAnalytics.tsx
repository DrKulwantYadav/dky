"use client";

import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import MetaPixel from "@/components/MetaPixel";

export default function SiteAnalytics() {
  const pathname = usePathname();

  // Keep Google Analytics off camp pages; their Meta events are configured
  // separately and do not include form fields or booking identifiers.
  if (pathname === "/camps" || pathname.startsWith("/camps/")) return <MetaPixel />;

  return <><GoogleAnalytics gaId="G-B0Y32VYD07" /><MetaPixel /></>;
}
