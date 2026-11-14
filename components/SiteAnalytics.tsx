"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import MetaPixel from "@/components/MetaPixel";

export default function SiteAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/conditions/diabetes" && pathname !== "/email/unsubscribe") return;
    // A client-side route change can leave third-party scripts from the previous
    // page in the document. Reload once so the questionnaire opens without them.
    if (document.getElementById("meta-pixel") || document.querySelector('script[src*="googletagmanager.com"]')) {
      window.location.reload();
    }
  }, [pathname]);

  // Keep Google Analytics off camp pages; their Meta events are configured
  // separately and do not include form fields or booking identifiers.
  if (pathname === "/camps" || pathname.startsWith("/camps/")) return <MetaPixel />;
  if (pathname === "/conditions/diabetes" || pathname === "/email/unsubscribe") return null;

  return <><GoogleAnalytics gaId="G-B0Y32VYD07" /><MetaPixel /></>;
}
