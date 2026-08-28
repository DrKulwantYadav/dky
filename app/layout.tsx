import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import FloatingWhatsApp from "./FloatingWhatsApp";
import { GoogleAnalytics } from '@next/third-parties/google';
import MetaPixel from "@/components/MetaPixel";


const display = Source_Serif_4({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"], style: ["normal"] });
const sans = Source_Sans_3({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
  const schema = { "@context": "https://schema.org", "@type": "Physician", name: "Dr. Kulwant Yadav", medicalSpecialty: "Internal Medicine", description: "Honorary Consultant in Internal Medicine at Gopinath Hospital, Bhiwadi.", telephone: "+91-92057-75932", address: { "@type": "PostalAddress", streetAddress: "H-226, Industrial Area, Near Ramphal Cinema", addressLocality: "Bhiwadi", postalCode: "301019", addressRegion: "Rajasthan", addressCountry: "IN" }, hasMap: "https://maps.app.goo.gl/W9QHHQxRkA5bGasi7", sameAs: ["https://www.instagram.com/drkulwantyadavmedicine", "https://youtube.com/@medicinesquarebydrkulwant", "https://www.facebook.com/share/1EDnNWKTW1/", "https://share.google/NRSnun2Z3rW8XpbU5"], areaServed: [{ "@type": "City", name: "Bhiwadi" }, { "@type": "AdministrativeArea", name: "Alwar" }], knowsAbout: ["Diabetes", "Hypertension", "Fatty liver disease", "Chronic kidney disease", "Respiratory infections", "Metabolic syndrome"] };
  return <html lang="en-IN"><body className={`${display.variable} ${sans.variable}`}>  <GoogleAnalytics gaId="G-B0Y32VYD07" /> <MetaPixel /> <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />{children}<details className="mobile-menu"><summary aria-label="Open website menu"><span>Menu</span><i aria-hidden="true"/></summary><nav aria-label="Mobile navigation"><a href="/">Home</a><a href="/about-dr-kulwant-yadav">About Dr. Yadav</a><a href="/conditions">Conditions treated</a><a href="/services">Services</a><a href="/health-library">Health library</a><a href="/clinic-bhiwadi">Clinic & directions</a></nav></details><FloatingWhatsApp/><nav className="mobile-action-bar" aria-label="Quick contact actions"><a href="tel:+919205775932"><span className="mobile-icon-crop call-crop"><img src="/call-contact-icon.webp" alt="" aria-hidden="true"/></span><span className="action-label">Call</span></a><a href="https://wa.me/919205775932" target="_blank" rel="noopener noreferrer"><span className="mobile-icon-crop whatsapp-crop"><img src="/whatsapp-contact-icon.avif" alt="" aria-hidden="true"/></span><span className="action-label">WhatsApp</span></a><a className="book-action" href="/book-appointment"><span className="action-icon calendar-icon" aria-hidden="true">＋</span><span className="action-label">Book Appointment</span></a></nav></body></html>;
}
