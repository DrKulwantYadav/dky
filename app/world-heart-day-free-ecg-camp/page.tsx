import type { Metadata } from "next";
import SiteFooter from "../SiteFooter";
import { pageMetadata } from "../seo";
import CampRegistration from "./CampRegistration";

export const metadata: Metadata = pageMetadata({
  title: "Free ECG and Heart Check-up Camp | September 2026",
  description: "Register for a free ECG and heart check-up on Sundays in September 2026 at Gopinath Hospital, Bhiwadi, with Dr. Kulwant Yadav.",
  path: "/world-heart-day-free-ecg-camp",
});

const campHours = [
  ["6", "Sunday", "9:00 am – 1:00 pm"],
  ["13", "Sunday", "9:00 am – 1:00 pm"],
  ["20", "Sunday", "9:00 am – 1:00 pm"],
  ["27", "Sunday", "9:00 am – 1:00 pm"],
];

const focusedChecks = [
  {
    number: "01",
    title: "12-Lead ECG",
    description: <>Performed using the US FDA-approved <strong>GE MAC 5 A4 system</strong>, featuring the globally recognized <strong>Marquette™ ECG Analysis Algorithm</strong> for accurate diagnosis and rhythm analysis.</>,
  },
  {
    number: "02",
    title: "Blood Pressure & BMI",
    description: <>Blood pressure check and Body Mass Index (BMI) calculation.</>,
  },
  {
    number: "03",
    title: "Heart-risk review",
    description: <>A focused review of symptoms and common cardiovascular risk factors.</>,
  },
  {
    number: "04",
    title: "Doctor guidance",
    description: <>Direct medical guidance based on the screening results, helping participants determine the appropriate next steps for their heart health.</>,
  },
];

export default function WorldHeartDayCampPage() {
  return <main className="heart-camp-page">
    <div className="info-strip"><span>Free heart-health camp · September 2026</span><strong>Free ECG &amp; heart check-up</strong></div>
    <header className="site-header">
      <a className="brand" href="/"><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
      <nav aria-label="Camp page navigation"><a href="/">Home</a><a href="#campaign">Camp details</a><a href="#who-should-attend">Who should attend</a><a href="#register">Register</a></nav>
      <a className="header-cta" href="#register">Register free</a>
    </header>

    <section className="heart-camp-hero">
      <div className="heart-camp-copy">
        <p className="eyebrow"><span/> Free ECG camp · 6 September 2026</p>
        <h1>Free ECG &amp;<br/><em>Heart Check-up Camp</em></h1>
        <p>Take a simple, informed step toward understanding your heart health with a focused screening and medical guidance at Gopinath Hospital, Bhiwadi.</p>
        <div className="heart-camp-actions"><CampRegistration compact /></div>
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
          <span>Free ECG camp</span>
          <strong>06</strong>
          <b>September 2026</b>
          <div><small>Venue</small><p>Gopinath Hospital<br/>Bhiwadi, Rajasthan</p></div>
          <em>Free camp · Prior registration recommended</em>
        </div>
      </aside>
    </section>

    <section className="heart-focused-check" id="camp-details">
      <div className="heart-focused-heading">
        <p className="section-label"><span>Free services</span> What is included</p>
        <h2>A focused check for <em>your heart.</em></h2>
        <p>To ensure excellent check-up quality, we will use high-end diagnostic equipment rather than conventional camp-level equipment. Each participant will receive the following services completely free of charge:</p>
      </div>
      <div className="heart-focused-grid">
        {focusedChecks.map((check) => <article key={check.number}>
          <span>{check.number}</span>
          <h3>{check.title}</h3>
          <p>{check.description}</p>
        </article>)}
      </div>
    </section>

    <section className="heart-campaign-message" id="campaign">
      <span>Heart-health awareness · 2026</span>
      <h2>Don&apos;t Miss a Beat</h2>
      <p>In 2026, we will continue the momentum of &lsquo;Don&apos;t Miss a Beat&rsquo;, raising awareness of the world&apos;s number one killer and highlighting the importance of recognising the signs and symptoms of cardiovascular disease (CVD).</p>
    </section>

    <section className="heart-attend" id="who-should-attend">
      <div><p className="section-label light"><span>01</span> Consider attending</p><h2>Know your risk before symptoms become serious.</h2></div>
      <ul>
        <li>Adults with diabetes, high blood pressure, high cholesterol or excess weight</li>
        <li>People with a family history of heart disease or stroke</li>
        <li>Anyone experiencing recurring palpitations, unusual breathlessness or reduced exercise tolerance</li>
        <li>Adults who smoke, have a sedentary lifestyle or have not had a recent health review</li>
      </ul>
    </section>

    <section className="heart-prepare">
      <div><p className="section-label"><span>02</span> Before you visit</p><h2>Bring a few useful details.</h2></div>
      <div className="heart-prepare-list"><p><b>Current medicines</b><span>Bring your prescription or an updated medicine list.</span></p><p><b>Previous reports</b><span>Carry earlier ECGs, blood tests or heart-related reports if available.</span></p><p><b>Comfortable clothing</b><span>Wear clothing that allows easy access to the chest, arms and ankles for an ECG.</span></p></div>
    </section>

    <section className="heart-register" id="register">
      <p className="eyebrow"><span/> Reserve your place</p>
      <h2>Join the free camp from <em>6 September.</em></h2>
      <p>Free check-ups are planned on all four Sundays in September. Registration is recommended because capacity may be limited.</p>
      <CampRegistration />
      <a className="heart-register-directions" href="https://maps.app.goo.gl/W9QHHQxRkA5bGasi7" target="_blank" rel="noopener noreferrer">Get directions ↗</a>
    </section>

    <section className="heart-location-hours" id="location-hours">
      <div className="heart-location-heading"><p className="section-label"><span>03</span> Plan your visit</p><h2>Location &amp; hours</h2></div>
      <div className="heart-location-grid">
        <article className="heart-map-card">
          <iframe title="Gopinath Hospital location on Google Maps" src="https://www.google.com/maps?q=Gopinath%20Hospital%2C%20H-226%20Industrial%20Area%2C%20Bhiwadi%2C%20Rajasthan%20301019&amp;output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
          <a href="https://maps.app.goo.gl/W9QHHQxRkA5bGasi7" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>
        </article>
        <article className="heart-contact-card">
          <span>Hospital details</span>
          <h3>Gopinath Hospital</h3>
          <address>H-226, Industrial Area<br/>Near Ramphal Cinema<br/>Bhiwadi – 301019, Rajasthan</address>
          <dl><div><dt>Mobile</dt><dd><a href="tel:+919205775932">+91 92057 75932</a></dd></div><div><dt>Email enquiries</dt><dd><a href="tel:+919205775932">Contact the clinic to confirm</a></dd></div></dl>
        </article>
        <article className="heart-hours-card">
          <span>Free camp check-up hours</span>
          <h3>September 2026</h3>
          <div className="heart-hours-list">{campHours.map(([date, day, time]) => <p key={date}><strong>{date}</strong><span>{day}</span><b>{time}</b></p>)}</div>
        </article>
      </div>
    </section>

    <section className="heart-final-cta">
      <p>Four Sundays. One important step for your heart.</p>
      <h2>Don&apos;t miss the opportunity to get a free ECG check-up.</h2>
      <CampRegistration compact />
      <small>For chest pain, severe breathlessness, fainting, stroke symptoms or another sudden serious symptom, visit the nearest emergency department immediately.</small>
    </section>

    <SiteFooter />
  </main>;
}
