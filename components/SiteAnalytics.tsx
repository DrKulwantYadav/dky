"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import MetaPixel from "@/components/MetaPixel";

export default function SiteAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/conditions/diabetes") return;
    // A client-side route change can leave third-party scripts from the previous
    // page in the document. Reload once so the questionnaire opens without them.
    if (document.getElementById("meta-pixel") || document.querySelector('script[src*="googletagmanager.com"]')) {
      window.location.reload();
    }
  }, [pathname]);

  // Health-related registration and risk forms must not load ad or analytics scripts.
  if (pathname === "/camps" || pathname.startsWith("/camps/") || pathname === "/conditions/diabetes") return null;

  return <><GoogleAnalytics gaId="G-B0Y32VYD07" /><MetaPixel /></>;
}
