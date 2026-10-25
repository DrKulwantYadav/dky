"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/camps/meta-tracking";

const META_PIXEL_PAGES = new Set(["/", "/about-dr-kulwant-yadav", "/clinic-bhiwadi", "/research"]);

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function MetaPixel() {
  const pathname = usePathname();
  const trackPage = META_PIXEL_PAGES.has(pathname) || pathname === "/camps" || pathname.startsWith("/camps/");
  const firstPageView = useRef(true);

  useEffect(() => {
    const hasRecoveryHash = window.location.hash.includes("type=invite") || window.location.hash.includes("type=recovery");
    const hasAuthCode = new URLSearchParams(window.location.search).has("code");
    if ((hasRecoveryHash || hasAuthCode) && !window.location.pathname.startsWith("/admin/setup-password")) {
      window.location.replace(`/admin/setup-password${window.location.search}${window.location.hash}`);
      return;
    }
    if (!trackPage) return;
    // The base script records the first eligible view. Next.js route changes need to be
    // recorded separately because they do not reload the document.
    if (firstPageView.current) {
      firstPageView.current = false;
      return;
    }

    window.fbq?.("track", "PageView");
  }, [pathname, trackPage]);

  if (!trackPage) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;
            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];
            t=b.createElement(e);
            t.async=!0;
            t.src=v;
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
            }(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
