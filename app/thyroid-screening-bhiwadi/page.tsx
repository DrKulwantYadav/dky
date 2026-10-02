import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowUpRight, Brain, CalendarDays, HeartPulse, MapPin, Moon, Phone, Scale, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import JsonLd from "../JsonLd";
import SiteFooter from "../SiteFooter";
import { breadcrumbSchema, medicalWebPageSchema, pageMetadata } from "../seo";
import ThyroidInteractions from "./ThyroidInteractions";
import "./thyroid.css";

const path = "/thyroid-screening-bhiwadi";
const maps = "https://maps.app.goo.gl/W9QHHQxRkA5bGasi7";
const whatsapp = "https://wa.me/919205775932?text=I%20would%20like%20to%20ask%20about%20the%20Ultra-Sensitive%20TSH%20Screening%20on%2010%20October%202026%20in%20Bhiwadi.";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Thyroid TSH Screening in Bhiwadi | Dr. Kulwant Yadav",
    description: "Register for an Ultra-Sensitive TSH thyroid screening at Gopinath Hospital, Bhiwadi, under the guidance of Dr. Kulwant Yadav. Check campaign and registration details.",
    path,
  }),
  title: { absolute: "Thyroid TSH Screening in Bhiwadi | Dr. Kulwant Yadav" },
  keywords: ["Thyroid Test Bhiwadi", "TSH Test Bhiwadi", "Thyroid Screening Bhiwadi", "Thyroid Doctor Bhiwadi", "Internal Medicine Doctor Bhiwadi", "Thyroid Checkup Bhiwadi"],
};

const considerations = [
  { icon: Zap, title: "Persistent tiredness", copy: "Feeling unusually low on energy for an extended period." },
  { icon: Scale, title: "Changes in weight", copy: "Unexpected weight changes can have several possible causes." },
  { icon: Brain, title: "Difficulty concentrating", copy: "Persistent difficulty focusing may warrant broader health evaluation." },
  { icon: HeartPulse, title: "Changes in mood", copy: "Mood changes can have many causes, including medical and lifestyle factors." },
  { icon: Moon, title: "Changes in sleep", copy: "A change in sleep quality or pattern may be worth discussing with a doctor." },
  { icon: Users, title: "Family history", copy: "If thyroid conditions run in your family, you may wish to discuss screening with a healthcare professional." },
];

const benefits = [
  { icon: Activity, title: "Ultra-Sensitive TSH Test", copy: "Available as part of this thyroid awareness initiative. Ask the hospital team for the current test price." },
  { icon: ShieldCheck, title: "Medical Guidance", copy: "Screening under the guidance of Dr. Kulwant Yadav, Consultant – Internal Medicine." },
  { icon: MapPin, title: "Convenient Local Screening", copy: "At Gopinath Hospital in Bhiwadi, close to home." },
  { icon: CalendarDays, title: "Simple Registration", copy: "Register online, or ask our team on WhatsApp." },
];

const faqs = [
  ["What is the price of the Ultra-Sensitive TSH test?", "The campaign price is being confirmed. Please contact the hospital team for the current test price."],
  ["Do I need to register before visiting?", "Prior registration is recommended so the hospital can manage screening visits efficiently."],
  ["Who can register?", "Adults interested in thyroid health screening may register. Final suitability for testing can be determined by the medical team where appropriate."],
  ["Do I need to fast before a TSH test?", "Fasting requirements can depend on the test instructions and your medical situation. Please follow the instructions provided by the hospital team after registration."],
  ["Does an abnormal TSH result mean I have thyroid disease?", "No. A screening result should be interpreted by a qualified healthcare professional and may require further evaluation."],
  ["Where is the screening being conducted?", "Gopinath Hospital, Bhiwadi, Rajasthan."],
  ["Can I register a parent or family member?", "Yes. The form allows you to register yourself, a parent, spouse or another family member."],
  ["Is a consultation included in the test price?", "Consultation charges and availability have not been confirmed. Please contact the hospital team for details."],
];

function RegisterButton({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <button type="button" data-thyroid-register className={`thyroid-button${light ? " thyroid-button-light" : ""}`}>{children}<ArrowUpRight size={18} aria-hidden="true" /></button>;
}

function WhatsappLink({ children, outlined = false }: { children: React.ReactNode; outlined?: boolean }) {
  return <a className={`thyroid-link-button${outlined ? " thyroid-link-outline" : ""}`} data-thyroid-track="whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={17} aria-hidden="true" /></a>;
}

export default function ThyroidScreeningPage() {
  const schema = [
    medicalWebPageSchema({ name: "Thyroid TSH Screening in Bhiwadi", description: "Information and registration for an Ultra-Sensitive TSH screening on 10 October 2026 at Gopinath Hospital, Bhiwadi.", path, about: "Thyroid screening and TSH testing" }),
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Thyroid Screening", path }]),
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ];

  return <main className="thyroid-page">
    <JsonLd data={schema} />
    <ThyroidInteractions />
    <div className="thyroid-topline"><span>World Mental Health Day · Thyroid Awareness Initiative</span><span>Gopinath Hospital, Bhiwadi</span></div>
    <header className="site-header">
      <Link className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></Link>
      <nav aria-label="Thyroid screening navigation"><a href="#about-tsh">About the test</a><a href="#screening">What you get</a><a href="#location">Location</a><a href="#faq">FAQs</a></nav>
      <RegisterButton>Register for Screening</RegisterButton>
    </header>

    <section className="thyroid-hero" aria-labelledby="thyroid-title">
      <div className="thyroid-hero-copy">
        <p className="thyroid-kicker"><span className="thyroid-kicker-dot" /> Thyroid Awareness Initiative</p>
        <h1 id="thyroid-title">Thyroid Screening <em>in Bhiwadi</em></h1>
        <h2>Get an Ultra-Sensitive TSH Test</h2>
        <p>Thyroid hormone imbalance can sometimes be associated with changes in energy, mood, concentration, sleep, weight and overall well-being. A simple TSH screening can help identify whether further medical evaluation may be appropriate.</p>
        <div className="thyroid-offer"><Sparkles size={25} aria-hidden="true" /><div><strong>ULTRA-SENSITIVE TSH SCREENING</strong><span>World Mental Health Day awareness initiative</span></div></div>
        <div className="thyroid-hero-actions"><RegisterButton>Register for Screening</RegisterButton><WhatsappLink outlined>WhatsApp Us</WhatsappLink></div>
        <p className="thyroid-hero-note">Prior registration recommended · No diagnosis made online</p>
      </div>
      <aside className="thyroid-hero-side">
        <div className="thyroid-portrait"><Image src="/dr-kulwant-yadav-portrait.png" alt="Dr. Kulwant Yadav, Consultant in Internal Medicine" width={800} height={960} priority sizes="(max-width: 760px) 100vw, 42vw" /></div>
        <div className="thyroid-event-card"><span>LOCALLY GUIDED SCREENING</span><strong>Care in Bhiwadi</strong><dl><div><dt>Venue</dt><dd>Gopinath Hospital, Bhiwadi</dd></div><div><dt>Under the guidance of</dt><dd>Dr. Kulwant Yadav<br />Consultant – Internal Medicine</dd></div></dl></div>
      </aside>
    </section>

    <section className="thyroid-section thyroid-awareness"><div className="thyroid-section-intro"><p className="thyroid-kicker">A gentle reminder</p><h2>Sometimes It May Be Worth Looking <em>Beyond Stress</em></h2><p>Changes in energy, mood, sleep, concentration or weight can happen for many different reasons. Thyroid function is one area a doctor may consider while evaluating such symptoms. This campaign aims to make basic screening more accessible in Bhiwadi.</p></div><div className="thyroid-awareness-flow"><div className="thyroid-symptoms"><span>Energy</span><span>Mood</span><span>Concentration</span><span>Sleep</span><span>Weight changes</span></div><span className="thyroid-flow-arrow" aria-hidden="true">↓</span><p>Several factors can influence these</p><span className="thyroid-flow-arrow" aria-hidden="true">↓</span><strong>Thyroid health may be one factor worth evaluating</strong></div></section>

    <section className="thyroid-section thyroid-test" id="about-tsh"><div className="thyroid-test-icon" aria-hidden="true"><svg viewBox="0 0 140 140" fill="none"><path d="M70 27v25M70 52c-12-21-36-25-45-6-9 20 3 55 21 61 11 4 20-3 24-12 4 9 13 16 24 12 18-6 30-41 21-61-9-19-33-15-45 6Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M70 52v43" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></div><div><p className="thyroid-kicker">The basics, explained simply</p><h2>What is a <em>TSH Test?</em></h2><p>TSH stands for <strong>Thyroid-Stimulating Hormone</strong>. It is a blood test commonly used as part of an evaluation of how the thyroid is working.</p><p>An abnormal result does not automatically mean someone has a particular thyroid disorder. A healthcare professional should interpret results in the context of your health and advise if any further testing is needed.</p></div></section>

    <section className="thyroid-section thyroid-consider"><div className="thyroid-section-intro"><p className="thyroid-kicker">When to start a conversation</p><h2>When May Thyroid Screening Be <em>Worth Discussing?</em></h2><p>These examples are reasons to talk with a healthcare professional—not a symptom checklist or a self-diagnosis tool.</p></div><div className="thyroid-card-grid">{considerations.map(({ icon: Icon, title, copy }) => <article className="thyroid-consider-card" key={title}><Icon size={26} strokeWidth={1.7} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>)}</div><p className="thyroid-caution">These symptoms are non-specific and can have many causes. Screening and medical consultation are important for proper evaluation.</p></section>

    <section className="thyroid-section thyroid-screening" id="screening"><div className="thyroid-screening-head"><div><p className="thyroid-kicker">The screening offer</p><h2>What You Get</h2><p>A simple, local starting point for a more informed conversation about thyroid health.</p></div><div className="thyroid-price"><span>TSH test price</span><strong>To be confirmed</strong><p>The hospital team will confirm the price</p></div></div><div className="thyroid-benefit-grid">{benefits.map(({ icon: Icon, title, copy }, index) => <article key={title}><span className="thyroid-benefit-number">0{index + 1}</span><Icon size={27} strokeWidth={1.6} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>)}</div><RegisterButton light>Register for Screening</RegisterButton><p className="thyroid-screening-note">Test pricing and consultation charges should be confirmed with the hospital team before your visit.</p></section>

    <section className="thyroid-section thyroid-early"><span className="thyroid-early-mark" aria-hidden="true">+</span><div><p className="thyroid-kicker">Preventive care, without fear</p><h2>Small Check. <em>Better Awareness.</em></h2><p>Preventive screening may help identify health concerns that might otherwise go unnoticed. A screening result is not a final diagnosis, but it can help determine whether a medical consultation or further testing may be appropriate.</p></div></section>

    <section className="thyroid-section thyroid-faq" id="faq"><div className="thyroid-section-intro"><p className="thyroid-kicker">Good to know</p><h2>Frequently Asked <em>Questions</em></h2></div><div className="thyroid-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

    <section className="thyroid-section thyroid-location" id="location"><div><p className="thyroid-kicker">Find us in Bhiwadi</p><h2>Screening <em>Location</em></h2><p><strong>Gopinath Hospital</strong><br />H-226, Industrial Area, near Ramphal Cinema<br />Bhiwadi, Rajasthan 301019</p><div className="thyroid-location-actions"><a href={maps} data-thyroid-track="directions" target="_blank" rel="noopener noreferrer">Get Directions ↗</a><a href="tel:+919205775932" data-thyroid-track="phone"><Phone size={17} aria-hidden="true" /> Call Hospital</a><WhatsappLink>WhatsApp</WhatsappLink></div></div><iframe title="Google Map showing Gopinath Hospital in Bhiwadi" src="https://www.google.com/maps?q=Gopinath%20Hospital%2C%20H-226%2C%20Industrial%20Area%2C%20Bhiwadi%20301019&output=embed" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></section>

    <section className="thyroid-final"><p className="thyroid-kicker">10 October 2026 · Bhiwadi</p><h2>Take a Simple Step Toward <em>Better Health Awareness</em></h2><p>Register for the Ultra-Sensitive TSH Screening at Gopinath Hospital, Bhiwadi.</p><div><RegisterButton light>Register for Screening</RegisterButton><WhatsappLink outlined>Ask on WhatsApp</WhatsappLink></div><small>Saturday, 10 October 2026 · Time to be confirmed · Gopinath Hospital</small></section>
    <aside className="thyroid-medical-disclaimer"><strong>Medical Disclaimer:</strong> The information on this page is for general health awareness and does not replace professional medical advice, diagnosis or treatment. Screening results should be interpreted by an appropriate healthcare professional.</aside>
    <SiteFooter />
    <div className="thyroid-mobile-cta"><button type="button" data-thyroid-register>Register Now <ArrowUpRight size={18} aria-hidden="true" /></button><a href={whatsapp} data-thyroid-track="whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Ask about screening on WhatsApp">WhatsApp</a></div>
  </main>;
}
