import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { conditionProfiles } from "../data";
import ConsultationActions from "../../ConsultationActions";
import { pageMetadata } from "../../seo";

export function generateStaticParams(){return Object.keys(conditionProfiles).map(slug=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const c=conditionProfiles[slug];return c?pageMetadata({title:c.title,description:c.short,path:`/conditions/${slug}`,type:"article"}):{title:"Condition guide not found",robots:{index:false,follow:false}}}
const List=({items}:{items:string[]})=><ul>{items.map(item=><li key={item}>{item}</li>)}</ul>;

export default async function ConditionPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;const c=conditionProfiles[slug];if(!c)notFound();
  return <main className="condition-detail">
    <div className="info-strip"><span>Patient education · Internal Medicine</span><strong>Emergency symptoms? Visit the nearest emergency department.</strong></div>
    <header className="site-header"><a className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a><nav><a href="/conditions">All conditions</a><a href="/about-dr-kulwant-yadav">About</a><a href="/health-library">Health library</a></nav><a href="/book-appointment" className="header-cta">Book appointment</a></header>
    <section className="condition-hero"><a href="/conditions" className="back-link">← Conditions treated</a><p className="eyebrow"><span/> Patient condition guide</p><h1>{c.title}</h1><p>{c.overview}</p></section>
    <div className="condition-layout"><aside className="condition-index"><span>On this page</span><a href="#symptoms">Common symptoms</a><a href="#risks">Risk factors</a><a href="#consult">When to consult</a><a href="#assessment">Assessment</a><a href="#treatment">Treatment approach</a><a href="#urgent">Urgent signs</a><a href="#faq">Questions</a></aside><article className="condition-content"><section id="symptoms"><span className="content-number">01</span><h2>Common symptoms</h2><List items={c.symptoms}/></section><section id="risks"><span className="content-number">02</span><h2>Risk factors</h2><List items={c.risks}/></section><section id="consult"><span className="content-number">03</span><h2>When to consult a doctor</h2><List items={c.consult}/></section><section id="assessment"><span className="content-number">04</span><h2>How the condition is assessed</h2><p>{c.assessment}</p><h3>Possible investigations</h3><List items={c.investigations}/><p className="context-note">Tests are selected according to symptoms, examination and individual risk. Not every person needs every investigation listed.</p></section><section id="treatment"><span className="content-number">05</span><h2>General treatment approach</h2><p>{c.treatment}</p><h3>Lifestyle considerations</h3><List items={c.lifestyle}/></section><section id="urgent" className="urgent-section"><span className="content-number">06</span><h2>Warning signs requiring urgent care</h2><List items={c.urgent}/><p>If a warning sign is present, do not wait for a routine appointment. Seek urgent assessment.</p></section><section id="faq"><span className="content-number">07</span><h2>Frequently asked questions</h2>{c.faqs.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</section></article></div>
    <ConsultationActions tone="navy" />
    <section className="medical-disclaimer"><strong>Medical disclaimer</strong><p>This information is for general education and cannot diagnose a condition or replace an individual consultation. Treatment and investigation choices depend on personal history, examination and clinical judgement. For severe, sudden or life-threatening symptoms, visit the nearest emergency department.</p></section>
  </main>;
}
