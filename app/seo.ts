import type { Metadata } from "next";

export const siteUrl = "https://drkulwantyadav.com";
export const physicianId = `${siteUrl}/#dr-kulwant-yadav`;

type BreadcrumbItem = {
  name: string;
  path: string;
};

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

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function medicalWebPageSchema({
  name,
  description,
  path,
  about,
}: {
  name: string;
  description: string;
  path: string;
  about?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name,
    description,
    url: `${siteUrl}${path}`,
    about: about ? { "@type": "Thing", name: about } : undefined,
    reviewedBy: { "@id": physicianId },
  };
}
