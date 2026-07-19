import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"] });
const sans = Manrope({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://drkulwantyadav.com"),
  title: { default: "Dr. Kulwant Yadav | Internal Medicine Doctor in Bhiwadi", template: "%s | Dr. Kulwant Yadav" },
  description: "Consult Dr. Kulwant Yadav, Internal Medicine specialist in Bhiwadi, for diabetes, hypertension, fatty liver, kidney, respiratory, infection and adult medical care.",
  keywords: ["Internal Medicine doctor in Bhiwadi", "Dr Kulwant Yadav", "diabetes doctor Bhiwadi", "hypertension specialist Bhiwadi", "fatty liver treatment Bhiwadi", "general physician Bhiwadi"],
  authors: [{ name: "Dr. Kulwant Yadav" }],
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_IN", url: "/", siteName: "Dr. Kulwant Yadav", title: "Dr. Kulwant Yadav | Consultant Internal Medicine", description: "Thoughtful care. Clear answers. Better health.", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Dr. Kulwant Yadav, Consultant Internal Medicine" }] },
  twitter: { card: "summary_large_image", title: "Dr. Kulwant Yadav | Consultant Internal Medicine", description: "Thoughtful care. Clear answers. Better health.", images: ["/og.png"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schema = { "@context": "https://schema.org", "@type": "Physician", name: "Dr. Kulwant Yadav", medicalSpecialty: "Internal Medicine", description: "Consultant in Internal Medicine providing adult medical care in Bhiwadi.", areaServed: [{ "@type": "City", name: "Bhiwadi" }, { "@type": "AdministrativeArea", name: "South Haryana" }], knowsAbout: ["Diabetes", "Hypertension", "Fatty liver disease", "Chronic kidney disease", "Respiratory infections", "Metabolic syndrome"] };
  return <html lang="en-IN"><body className={`${display.variable} ${sans.variable}`}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />{children}</body></html>;
}
