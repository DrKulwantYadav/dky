import type { Metadata } from "next";
import SiteFooter from "../SiteFooter";
import { pageMetadata } from "../seo";

export const metadata: Metadata = pageMetadata({
  title: "Free ECG and Heart Check-up Camp | World Heart Day",
  description: "Join the free ECG and heart check-up camp on 29 September at Gopinath Hospital, Bhiwadi, with Dr. Kulwant Yadav. Call or WhatsApp to register.",
  path: "/world-heart-day-free-ecg-camp",
});

const checks = [
  ["01", "Blood pressure check", "A careful blood-pressure reading with basic interpretation."],
  ["02", "ECG screening", "A resting ECG when clinically appropriate during the camp."],
  ["03", "Heart-risk review", "A focused review of symptoms and common cardiovascular risk factors."],
  ["04", "Doctor guidance", "Practical advice on the next step, follow-up or referral when required."],
];

export default function WorldHeartDayCampPage() {
  return <main className="heart-camp-page">
    <div className="info-strip"><span>World Heart Day · 29 September</span><strong>Free ECG &amp; heart check-up camp</strong></div>
    <header className="site-header">
      <a className="brand" href="/"><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
      <nav aria-label="Camp page navigation"><a href="/">Home</a><a href="#camp-details">Camp details</a><a href="#who-should-attend">Who should attend</a><a href="#register">Register</a></nav>
      <a className="header-cta" href="tel:+919205775932">Call to register</a>
    </header>

    <section className="heart-camp-hero">
      <div className="heart-camp-copy">
        <p className="eyebrow"><span/> World Heart Day · 29 September</p>
        <h1>Free ECG &amp;<br/><em>Heart Check-up Camp</em></h1>
        <p>Take a simple, informed step toward understanding your heart health with a focused screening and medical guidance at Gopinath Hospital, Bhiwadi.</p>
        <div className="heart-camp-actions">
          <a className="primary-button" href="https://wa.me/919205775932?text=I%20would%20like%20to%20register%20for%20the%20free%20World%20Heart%20Day%20ECG%20and%20heart%20check-up%20camp%20on%2029%20September." target="_blank" rel="noopener noreferrer">Register on WhatsApp <span>↗</span></a>
          <a className="heart-call-action" href="tel:+919205775932"><small>Call for registration</small><strong>+91 92057 75932</strong></a>
        </div>
      </div>
      <aside className="heart-camp-visual" aria-label="Dr. Kulwant Yadav and camp details">
        <div className="heart-portrait-wrap">
          <span className="heart-orbit heart-orbit-one" aria-hidden="true"/>
          <span className="heart-orbit heart-orbit-two" aria-hidden="true"/>
          <span className="heart-symbol" aria-hidden="true">♥</span>
          <img src="/dr-kulwant-yadav-portrait.png" alt="Dr. Kulwant Yadav, Consultant Internal Medicine"/>
          <div className="ecg-line" aria-hidden="true"><i/><i/><i/><i/><i/></div>
        </div>
        <div className="heart-date-card">
          <span>World Heart Day</span>
          <strong>29</strong>
          <b>September</b>
          <div><small>Venue</small><p>Gopinath Hospital<br/>Bhiwadi, Rajasthan</p></div>
          <em>Free camp · Prior registration recommended</em>
        </div>
      </aside>
    </section>

    <section className="heart-camp-intro" id="camp-details">
      <div><p className="section-label"><span>01</span> What is included</p><h2>A focused check for a <em>healthier heart.</em></h2></div>
      <p>The camp is designed to identify common warning signs and risk factors that may benefit from further medical attention. Screening does not replace emergency care or a complete cardiology evaluation.</p>
    </section>

    <section className="heart-check-grid" aria-label="Camp checks">
      {checks.map(([number, title, description]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{description}</p></article>)}
    </section>

    <section className="heart-attend" id="who-should-attend">
      <div><p className="section-label light"><span>02</span> Consider attending</p><h2>Know your risk before symptoms become serious.</h2></div>
      <ul>
        <li>Adults with diabetes, high blood pressure, high cholesterol or excess weight</li>
        <li>People with a family history of heart disease or stroke</li>
        <li>Anyone experiencing recurring palpitations, unusual breathlessness or reduced exercise tolerance</li>
        <li>Adults who smoke, have a sedentary lifestyle or have not had a recent health review</li>
      </ul>
    </section>

    <section className="heart-prepare">
      <div><p className="section-label"><span>03</span> Before you visit</p><h2>Bring a few useful details.</h2></div>
      <div className="heart-prepare-list"><p><b>Current medicines</b><span>Bring your prescription or an updated medicine list.</span></p><p><b>Previous reports</b><span>Carry earlier ECGs, blood tests or heart-related reports if available.</span></p><p><b>Comfortable clothing</b><span>Wear clothing that allows easy access to the chest, arms and ankles for an ECG.</span></p></div>
    </section>

    <section className="heart-register" id="register">
      <p className="eyebrow"><span/> Reserve your place</p>
      <h2>Join the free camp on <em>29 September.</em></h2>
      <p>Camp timings and individual availability should be confirmed with the clinic before travelling. Registration is recommended because capacity may be limited.</p>
      <div><a className="primary-button" href="https://wa.me/919205775932?text=I%20would%20like%20to%20register%20for%20the%20free%20World%20Heart%20Day%20ECG%20and%20heart%20check-up%20camp%20on%2029%20September." target="_blank" rel="noopener noreferrer">WhatsApp to register <span>↗</span></a><a href="tel:+919205775932">Call +91 92057 75932</a><a href="https://maps.app.goo.gl/W9QHHQxRkA5bGasi7" target="_blank" rel="noopener noreferrer">Get directions ↗</a></div>
    </section>

    <section className="heart-emergency-note"><strong>Important</strong><p>A camp screening is not suitable for emergencies. For chest pain, severe breathlessness, fainting, stroke symptoms or another sudden serious symptom, visit the nearest emergency department immediately.</p></section>
    <SiteFooter />
  </main>;
}
