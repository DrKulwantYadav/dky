import type { Metadata } from "next";
import Link from "next/link";
import ConsultationActions from "../ConsultationActions";
import { pageMetadata } from "../seo";
import SiteFooter from "../SiteFooter";

export const metadata: Metadata = pageMetadata({ title: "Policies and Medical Disclaimer", description: "Read the privacy policy, terms of use, medical disclaimer and appointment policy for Dr. Kulwant Yadav’s website.", path: "/policies", index: false });

export default function Policies() {
  return <main className="guide-page">
    <header className="simple-header"><Link className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></Link></header>
    <article><p className="eyebrow"><span/> Website information</p><h1>Policies</h1><section id="privacy"><h2>Privacy policy</h2><p>When you submit an appointment request, this website collects your name, mobile number, optional email, age group, patient type, selected appointment date and time, broad reason for consultation, and the time you gave consent. These details are stored in the clinic’s Supabase database and are available to authorised dashboard users so the clinic can respond to and manage your request. Screening registration forms may collect additional details shown on those forms. Please do not send detailed medical history or reports through the appointment form.</p><p>The website also uses Google Analytics and Meta Pixel to understand visits and campaign activity. A form submission reserves a request slot; the clinic will confirm the visit and payment details. No online payment is collected by this form.</p></section><section id="terms"><h2>Terms of use</h2><p>Information is provided for general education and may be updated. Use of this website does not establish a doctor–patient relationship.</p></section><section id="medical-disclaimer"><h2>Medical disclaimer</h2><p>Website content is not a diagnosis or substitute for consultation. For urgent or life-threatening symptoms, visit the nearest emergency department.</p></section><section id="cancellation"><h2>Appointment cancellation policy</h2><p>Cancellation and rescheduling terms will be published after the clinic booking process is confirmed.</p></section><section id="data-request"><h2>Data request / privacy contact</h2><p>For questions about a submitted request or its details, contact the clinic at <a href="tel:+919205775932">+91 92057 75932</a>.</p></section></article>
    <ConsultationActions tone="ivory" />
    <SiteFooter />
  </main>;
}
