import type { Metadata } from "next";
import ConsultationActions from "../ConsultationActions";
import { pageMetadata } from "../seo";

export const metadata: Metadata = pageMetadata({ title: "Policies and Medical Disclaimer", description: "Read the privacy policy, terms of use, medical disclaimer and appointment policy for Dr. Kulwant Yadav’s website.", path: "/policies", index: false });

export default function Policies() {
  return <main className="guide-page">
    <header className="simple-header"><a className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a></header>
    <article><p className="eyebrow"><span/> Website information</p><h1>Policies</h1><section id="privacy"><h2>Privacy policy</h2><p>This website does not currently collect appointment or health information through online forms. A complete privacy notice must be added before analytics, forms or third-party booking tools are enabled.</p></section><section id="terms"><h2>Terms of use</h2><p>Information is provided for general education and may be updated. Use of this website does not establish a doctor–patient relationship.</p></section><section id="medical-disclaimer"><h2>Medical disclaimer</h2><p>Website content is not a diagnosis or substitute for consultation. For urgent or life-threatening symptoms, visit the nearest emergency department.</p></section><section id="cancellation"><h2>Appointment cancellation policy</h2><p>Cancellation and rescheduling terms will be published after the clinic booking process is confirmed.</p></section><section id="data-request"><h2>Data request / privacy contact</h2><p>A verified privacy contact method will be published before any personal information is collected through this website.</p></section></article>
    <ConsultationActions tone="ivory" />
  </main>;
}
