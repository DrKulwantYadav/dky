import type { Metadata } from "next";
import SiteFooter from "../SiteFooter";
import { pageMetadata } from "../seo";
import AscvdRiskCalculator from "./AscvdRiskCalculator";
import styles from "./camp.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Completed Free ECG and Heart Check-up Camp | September 2026",
  description: "Information from the completed September 2026 heart-health camp at Gopinath Hospital, Bhiwadi, with Dr. Kulwant Yadav.",
  path: "/world-heart-day-free-ecg-camp",
});

const campHours = [
  ["6", "Sunday", "9:00 am – 1:00 pm"],
  ["13", "Sunday", "9:00 am – 1:00 pm"],
  ["20", "Sunday", "9:00 am – 1:00 pm"],
  ["27", "Sunday", "9:00 am – 1:00 pm"],
  ["29", "Tuesday", "10:00 am – 1:00 pm"],
];

const focusedChecks = [
  {
    number: "01",
    title: "Framingham Heart Risk Test",
    description: <>A Framingham-based estimate of 10-year cardiovascular risk using age, blood pressure, smoking and diabetes history, and available cholesterol results. The doctor can explain what your score means for prevention.</>,
  },
  {
    number: "02",
    title: "12-Lead ECG",
    description: <>A 12-lead ECG records the heart&apos;s electrical activity and can support a clinician&apos;s assessment of rhythm and other findings.</>,
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

const coreNumbers = [
  {
    name: "Blood Pressure",
    label: "The Silent Engine",
    targets: ["Below 120/80 mmHg"],
    why: "High blood pressure can damage blood vessels for years without symptoms, increasing the risk of stroke and heart failure.",
  },
  {
    name: "Blood Sugar",
    label: "The Energy Regulator",
    targets: ["Fasting: < 100 mg/dL"],
    why: "Persistently high blood sugar can damage nerves and arteries. A fasting result can help identify prediabetes early.",
  },
  {
    name: "Cholesterol",
    label: "The Arterial Traffic",
    targets: ["LDL: < 100 mg/dL", "HDL: > 60 mg/dL"],
    why: "Higher LDL contributes to plaque buildup in arteries. HDL helps carry cholesterol away; your LDL goal depends on your overall risk.",
  },
  {
    name: "Resting Heart Rate",
    label: "The Fitness Baseline",
    targets: ["60–100 bpm"],
    why: "Measured when you are calm and relaxed, resting heart rate offers one clue about cardiovascular fitness. Medicines and other factors can change it.",
  },
];

export default function WorldHeartDayCampPage() {
  return <main className={`heart-camp-page ${styles.page}`}>
    <div className="info-strip"><span>Completed heart-health camp · September 2026</span><strong>Free ECG &amp; heart check-up</strong></div>
    <div className="heart-completed-notice" role="status">This community health camp has concluded. Thank you to everyone who participated.</div>
    <header className="site-header">
      <a className="brand" href="/"><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
      <nav aria-label="Camp page navigation"><a href="/">Home</a><a href="#campaign">Camp details</a><a href="#know-your-numbers">Know your numbers</a><a href="/community-initiatives">Community activities</a></nav>
      <a className="header-cta" href="/community-initiatives/heart-health-september-2026">View Camp Highlights</a>
    </header>

    <section className="heart-camp-hero">
      <div className="heart-camp-copy">
        <p className="eyebrow"><span/> Completed free ECG camp · September 2026</p>
        <h1>September 2026<br/><em>Heart-Health Camp</em></h1>
        <div className="heart-camp-service-tabs" aria-label="Free screening services"><span>ECG</span><span>Framingham Heart Test</span><span>BP</span><span>RBS</span></div>
        <p>This original campaign page shares the heart-health information presented for the completed September 2026 initiative at Gopinath Hospital, Bhiwadi.</p>
        <div className="heart-camp-actions"><a className="primary-button" href="/community-initiatives/heart-health-september-2026">View Camp Highlights →</a><a className="primary-button" href="/book-appointment">Book a Regular Appointment →</a></div>
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
          <div className="heart-date-lockup"><strong>29</strong><p><b>September 2026</b></p></div>
          <div className="heart-date-venue"><small>Venue</small><p>Gopinath Hospital<br/>Bhiwadi, Rajasthan</p></div>
          <em>Camp completed</em>
        </div>
      </aside>
    </section>

    <section className="heart-focused-check" id="camp-details">
      <div className="heart-focused-heading">
        <p className="section-label"><span>Free services</span> What is included</p>
        <h2>A focused check for <em>your heart.</em></h2>
        <p>The original campaign described the following screening approach. Confirmed delivered services and highlights can be added to the community initiative page by the clinic.</p>
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
      <p>The 2026 campaign continued the momentum of &lsquo;Don&apos;t Miss a Beat&rsquo;, encouraging awareness of cardiovascular risk and the importance of recognising possible warning signs.</p>
    </section>

    <AscvdRiskCalculator />

    <section className="heart-numbers" id="know-your-numbers" aria-labelledby="heart-numbers-title">
      <div className="heart-numbers-heading">
        <div><p className="section-label light"><span>01</span> The Core 4 Dashboard</p><h2 id="heart-numbers-title">Know Your <em>Numbers</em></h2><p className="heart-numbers-subtitle">Don&apos;t wait for symptoms. Take control of your baseline.</p></div>
        <p className="heart-numbers-intro">Your body is constantly generating data. Are you listening? Decades of research, including the Framingham Heart Study, show the value of understanding risk factors before symptoms appear. Knowing these four numbers can shift your health strategy from reactive treatment toward proactive prevention.</p>
      </div>
      <div className="heart-numbers-grid">
        {coreNumbers.map((metric, index) => <article className="heart-number-card" key={metric.name}>
          <span className="heart-number-index">0{index + 1} / 04</span>
          <h3>{metric.name}</h3>
          <p className="heart-number-label">{metric.label}</p>
          <div className="heart-number-target"><small>General adult reference</small>{metric.targets.map((target) => <strong key={target}>{target}</strong>)}</div>
          <p className="heart-number-why">{metric.why}</p>
        </article>)}
      </div>
      <p className="heart-numbers-note">These are general adult reference values, not personal treatment targets. Ask your clinician what is right for you. Fasting glucose and cholesterol require blood tests and are not listed among the camp&apos;s free on-site checks.</p>
    </section>

    <section className="heart-prepare">
      <div><p className="section-label"><span>02</span> For a future consultation</p><h2>Bring a few useful details.</h2></div>
      <div className="heart-prepare-list"><p><b>Current medicines</b><span>Bring your prescription or an updated medicine list.</span></p><p><b>Previous reports</b><span>Carry earlier ECGs, blood tests or heart-related reports if available.</span></p><p><b>Comfortable clothing</b><span>Wear clothing that allows easy access to the chest, arms and ankles for an ECG.</span></p></div>
    </section>

    <section className="heart-framingham" aria-labelledby="framingham-title">
      <p className="section-label light"><span>03</span> Heart-health insight</p>
      <h2 id="framingham-title">Framingham Heart <em>Risk Test</em></h2>
      <p className="heart-framingham-intro">A Framingham-based assessment estimates the likelihood of a cardiovascular event over the next 10 years from established risk factors. It is a conversation tool—not a diagnosis—and helps turn everyday health information into a clearer prevention plan.</p>
      <div className="heart-framingham-benefits">
        <article><span>01</span><h3>See your baseline</h3><p>It brings together factors such as age, blood pressure, smoking, diabetes history and available cholesterol results into one understandable estimate.</p></article>
        <article><span>02</span><h3>Identify priorities</h3><p>Understanding the factors that influence risk can help you focus on the changes and follow-up that may matter most for your health.</p></article>
        <article><span>03</span><h3>Start the right conversation</h3><p>Your result gives you and your doctor a useful starting point for discussing prevention, testing and an individual care plan.</p></article>
      </div>
    </section>

    <section className="heart-register" id="register">
      <p className="eyebrow"><span/> Camp completed</p>
      <h2>Explore the <em>camp highlights.</em></h2>
      <p>This September 2026 camp has concluded. See verified highlights when published, or request a regular consultation for ongoing care.</p>
      <div className="heart-camp-actions"><a className="primary-button" href="/community-initiatives/heart-health-september-2026">View Camp Highlights →</a><a className="primary-button" href="/book-appointment">Book a Regular Appointment →</a></div>
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
          <span>Original camp schedule (completed)</span>
          <h3>September 2026</h3>
          <div className="heart-hours-list">{campHours.map(([date, day, time]) => <p key={date}><strong>{date}</strong><span>{day}</span><b>{time}</b></p>)}</div>
        </article>
      </div>
    </section>

    <section className="heart-final-cta">
      <p>Heart health matters beyond the camp.</p>
      <h2>Need ongoing medical care?</h2>
      <div className="heart-camp-actions"><a className="primary-button" href="/community-initiatives/heart-health-september-2026">View Camp Highlights →</a><a className="primary-button" href="/book-appointment">Book a Regular Appointment →</a></div>
      <small>For chest pain, severe breathlessness, fainting, stroke symptoms or another sudden serious symptom, visit the nearest emergency department immediately.</small>
    </section>

    <SiteFooter />
  </main>;
}
