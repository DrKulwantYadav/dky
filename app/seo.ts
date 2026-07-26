import type { Metadata } from "next";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  type?: "website" | "article";
};

export function pageMetadata({
  title,
  description,
  path,
  index = true,
  type = "website",
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index, follow: true },
    openGraph: {
      type,
      locale: "en_IN",
      url: path,
      siteName: "Dr. Kulwant Yadav",
      title,
      description,
      images: [{
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Dr. Kulwant Yadav, Consultant Internal Medicine in Bhiwadi",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}
