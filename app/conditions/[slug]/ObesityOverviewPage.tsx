import Image from "next/image";
import Link from "next/link";
import { Droplets, Footprints, HeartPulse, Leaf, ShieldCheck, Smile, Zap } from "lucide-react";
import ConsultationActions from "../../ConsultationActions";
import JsonLd from "../../JsonLd";
import SiteFooter from "../../SiteFooter";
import { breadcrumbSchema, medicalWebPageSchema, physicianId } from "../../seo";
import ObesityBmiCalculator from "./ObesityBmiCalculator";
import ObesityWaistHipCalculator from "./ObesityWaistHipCalculator";
import "./obesity-overview.css";

const foundations = [
  { number: "01", title: "Protect your strength", text: "A care plan can combine adequate nutrition with resistance exercise so that changes in weight also support everyday function." },
  { number: "02", title: "Make change sustainable", text: "Meals, movement, sleep and treatment should fit your routine. A plan you can repeat matters more than a short burst of effort." },
  { number: "03", title: "Care for the whole person", text: "Hunger, stress, medicines and mood can shape the experience of weight management. These deserve a thoughtful conversation." },
];

const guide = [
  { number: "01", title: "Build nourishing meals", text: "Include protein-rich foods such as dal, eggs, curd, paneer, beans, tofu or fish as appropriate for you. Add vegetables and fibre, and review portions without rigid rules.", cue: "Discuss nutrition needs if you have kidney disease, pregnancy or another medical condition." },
  { number: "02", title: "Keep muscles active", text: "Start with activities you can do safely: walking, chair exercises, resistance bands or simple body-weight movements. Increase gradually as your fitness improves.", cue: "Adults generally benefit from muscle-strengthening activity on two or more days each week." },
  { number: "03", title: "Make room for sleep", text: "Poor sleep and possible sleep apnoea can affect energy, appetite and health. Bring up snoring, breathing pauses or persistent daytime sleepiness at your visit.", cue: "The best routine is one you can maintain, including a regular sleep opportunity." },
  { number: "04", title: "Track more than weight", text: "Waist measurement, blood pressure, glucose, strength, activity and how you feel can add useful context to the scale.", cue: "Individual trends matter more than any single reading." },
  { number: "05", title: "Review and adjust", text: "Set realistic goals with a clinician, identify barriers, and revisit the plan. Medicines or specialist referral may be considered when appropriate.", cue: "There is no single plan that fits everyone." },
];

const dailyBenefits = [
  ["More comfortable movement", "Improved fitness and strength may make walking, stairs and daily tasks easier."],
  ["Steadier energy", "Sleep, regular activity and suitable nutrition can support day-to-day wellbeing."],
  ["A wider view of progress", "Health markers and physical function can improve even when weight changes slowly."],
  ["Goals that matter to you", "Choose outcomes that suit your life, preferences and health priorities."],
];

const organBenefits = [
  ["Heart and circulation", "Blood pressure, cholesterol and cardiovascular risk deserve attention alongside weight."],
  ["Blood sugar", "Assessment can identify prediabetes or diabetes and guide an appropriate care plan."],
  ["Liver", "Metabolic risk can be linked with fatty liver disease; testing is based on individual findings."],
  ["Kidneys", "Blood pressure, glucose and kidney function are reviewed together when clinically relevant."],
];

const dailyIcons = [Footprints, Zap, HeartPulse, Smile];
const organIcons = [HeartPulse, Droplets, Leaf, ShieldCheck];

const clinicalFocus = [
  "Obesity and abdominal adiposity",
  "Insulin resistance and prediabetes",
  "Type 2 diabetes associated with obesity",
  "MASLD (fatty liver disease)",
  "Obesity-related hypertension and dyslipidaemia",
  "Obstructive sleep apnoea",
  "Weight regain and difficulty maintaining weight loss",
];

const obesityFaqs = [
  { question: "Can BMI or waist-to-hip ratio diagnose obesity or another condition?", answer: "No. They are screening measurements. A clinician considers them alongside your health history, examination, waist measurement and other findings." },
  { question: "Does medical weight management always involve medicines?", answer: "No. Care may include nutrition, activity, sleep and treatment of related conditions. Medicines or specialist referral are considered only when appropriate after an individual assessment." },
  { question: "What should I bring to a weight-management consultation?", answer: "Bring your current medicine list, recent blood-test or imaging reports, and any record of weight or waist measurements you already have. You do not need to take new measurements before booking." },
];

function SectionHeading({ label, title, intro }: { label: string; title: string; intro?: string }) {
  return <div className="owm-section-heading"><span className="owm-kicker">{label}</span><h2>{title}</h2>{intro && <p>{intro}</p>}</div>;
}

export default function ObesityOverviewPage() {
  return <main className="owm-page">
    <JsonLd data={[{ ...medicalWebPageSchema({ name: "Medical Weight Management & Obesity Care in Bhiwadi | Dr. Kulwant Yadav", description: "Consult Dr. Kulwant Yadav, Consultant Internal Medicine in Bhiwadi, for medical obesity management, weight-related diabetes, fatty liver, metabolic assessment and evidence-based weight management.", path: "/conditions/obesity-weight-management", about: "Obesity and weight management" }), author: { "@id": physicianId } }, breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Conditions", path: "/conditions" }, { name: "Obesity", path: "/conditions/obesity-weight-management" }]), { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: obesityFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }]} />
    <div className="info-strip"><span>Patient education · Bhiwadi, Rajasthan</span><strong>Severe symptoms? Visit the nearest emergency department.</strong></div>
    <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></Link><nav aria-label="Website navigation"><Link href="/conditions">All conditions</Link><Link href="/about-dr-kulwant-yadav">About</Link><Link href="/health-library">Health library</Link><Link href="/community-initiatives">Community activities</Link></nav><Link href="/book-appointment" className="header-cta">Book appointment</Link></header>

    <section className="owm-hero"><div className="owm-hero-copy"><Link href="/conditions" className="back-link">← Conditions treated</Link><span className="owm-kicker">Medical weight management · Bhiwadi</span><h1>Healthier Choices In Every Step <em>beyond the scale.</em></h1><p>Weight and health are connected in many ways. Explore practical steps, understand your measurements, and find care that considers your whole life.</p><div className="owm-actions"><Link className="owm-button" href="/book-appointment">Request a consultation <span aria-hidden="true">→</span></Link><a className="owm-inline-link" href="#bmi">Explore this guide ↓</a></div><div className="owm-hero-note">Individual care with Dr. Kulwant Yadav · Gopinath Hospital, Bhiwadi</div></div><div className="owm-hero-media"><Image src="/obesity-weight-management-food-scale.png" alt="Balanced food, measuring tape and scale representing weight management" fill priority sizes="(max-width: 900px) 100vw, 46vw" /></div></section>

    <section id="bmi" className="owm-bmi-section owm-section"><SectionHeading label="01 / Understand your measurements" title="Look beyond one number." intro="BMI and waist-to-hip ratio are useful starting points. Your medical history, waist measurement and other health markers add important context." /><div className="owm-calculators"><ObesityBmiCalculator /><ObesityWaistHipCalculator /></div></section>

    <section className="owm-quality owm-section"><SectionHeading label="02 / A broader goal" title="What does healthier weight management look like?" intro="The aim is to support health, daily function and lasting habits while preserving strength." /><div className="owm-three-grid">{foundations.map(item => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>

    <section className="owm-bridge owm-section"><div className="owm-bridge-copy"><span className="owm-kicker">Your next step</span><h2>Ready for a plan that fits your life?</h2><p>A clinical review can connect weight concerns with sleep, medicines, blood pressure, diabetes risk and liver health.</p><Link className="owm-button owm-button-light" href="/book-appointment">Find medical support <span aria-hidden="true">→</span></Link></div><div className="owm-bridge-photo"><Image src="/weight-management-family-garden.png" alt="A mother and child enjoying active time together in a garden" fill sizes="(max-width: 1000px) 100vw, 42vw" /></div></section>

    <section className="owm-clinical owm-section" aria-labelledby="owm-clinical-title"><div className="owm-clinical-intro"><span className="owm-kicker">Clinical focus</span><h2 id="owm-clinical-title">Comprehensive Medical Weight Management</h2><p className="owm-clinical-lead">Beyond dieting: treating obesity and its metabolic complications.</p></div><div className="owm-clinical-details"><h3>Medical weight-management consultations may address:</h3><ul>{clinicalFocus.map(item => <li key={item}>{item}</li>)}</ul><p>Treatment is individualised according to clinical assessment, metabolic risk and patient goals.</p></div></section>

    <section id="daily-guide" className="owm-guide owm-section"><SectionHeading label="03 / Five practical foundations" title="Small actions, repeated well." intro="These are starting points for a conversation, not a prescription for every person." /><div className="owm-guide-list">{guide.map(item => <details key={item.number}><summary><span className="owm-guide-number">{item.number}</span><span className="owm-guide-title">{item.title}</span><span className="owm-guide-toggle" aria-hidden="true" /></summary><div className="owm-guide-answer"><p>{item.text}</p><small>{item.cue}</small></div></details>)}</div></section>

    <section className="owm-benefits owm-section"><SectionHeading label="04 / Everyday wellbeing" title="Progress can show up in daily life." intro="The changes that matter most are personal. For some people, these may include movement, energy and confidence in managing health." /><div className="owm-four-grid">{dailyBenefits.map(([title, text], index) => { const Icon = dailyIcons[index]; return <article key={title}><span className="owm-benefit-icon"><Icon size={27} strokeWidth={1.8} aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>; })}</div></section>

    <section className="owm-organs owm-section"><SectionHeading label="05 / Inside the body" title="Weight is one part of a larger health picture." intro="A medical assessment looks for connected conditions and chooses tests according to your history and examination." /><div className="owm-four-grid">{organBenefits.map(([title, text], index) => { const Icon = organIcons[index]; return <article key={title}><span className="owm-benefit-icon"><Icon size={27} strokeWidth={1.8} aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>; })}</div><p className="owm-fine-print">Benefits and risks vary between people. A clinician can help interpret your own results.</p></section>

    <section className="owm-measures owm-section"><SectionHeading label="06 / Beyond one number" title="What might your doctor review?" intro="No single measurement describes your health. The right assessment depends on your symptoms, history and priorities." /><div className="owm-measure-grid"><article><strong>01</strong><h3>Body measurements</h3><p>Weight trend, BMI and waist measurement, interpreted in context.</p></article><article><strong>02</strong><h3>Metabolic health</h3><p>Blood pressure, glucose, lipids and liver or kidney tests when indicated.</p></article><article><strong>03</strong><h3>Daily function</h3><p>Sleep, mobility, energy, mood and practical barriers to change.</p></article></div></section>

    <section className="owm-final owm-section"><div><span className="owm-kicker">07 / Make a plan together</span><h2>Support can be personal, practical and medically informed.</h2><p>If you are looking for a weight loss doctor in Bhiwadi, Dr. Yadav can assess obesity, metabolic health and related concerns such as diabetes or fatty liver within his Internal Medicine practice. Care may include lifestyle support, treatment of related conditions, and discussion of medicines or specialist referral when appropriate.</p><Link className="owm-button" href="/book-appointment">Request an appointment <span aria-hidden="true">→</span></Link></div><div className="owm-final-photo"><Image src="/research-hero-dr-kulwant.png" alt="Dr. Kulwant Yadav reviewing clinical information" fill sizes="(max-width: 900px) 100vw, 42vw" /></div></section>

    <section className="owm-faq owm-section"><SectionHeading label="Questions patients ask" title="Common questions about weight management." /><div className="owm-faq-list">{obesityFaqs.map(({ question, answer }) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

    <section className="owm-sources owm-section"><h2>Sources and medical note</h2><p>This guide is for adults and general education. It cannot diagnose a condition or replace a consultation. Seek urgent care for chest pain, severe breathlessness, fainting or other sudden serious symptoms.</p><ul><li><a href="https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight" target="_blank" rel="noopener noreferrer">World Health Organization: Obesity and overweight ↗</a></li><li><a href="https://www.who.int/publications-detail-redirect/9789241501491" target="_blank" rel="noopener noreferrer">World Health Organization: Waist circumference and waist-to-hip ratio ↗</a></li><li><a href="https://www.cdc.gov/physical-activity-basics/guidelines/adults.html" target="_blank" rel="noopener noreferrer">CDC: Adult physical activity guidance ↗</a></li><li><a href="https://www.nice.org.uk/guidance/ng246/chapter/Discussing-results-and-referral" target="_blank" rel="noopener noreferrer">NICE: Individualised weight-management discussions ↗</a></li></ul></section>
    <ConsultationActions tone="teal" />
    <SiteFooter />
  </main>;
}
