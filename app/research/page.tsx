import type { Metadata } from "next";
import ConsultationActions from "../ConsultationActions";
import SiteFooter from "../SiteFooter";
import { pageMetadata } from "../seo";

export const metadata: Metadata = pageMetadata({
  title: "Research and Academic Contributions",
  description: "Explore Dr. Kulwant Yadav's clinical research, peer-reviewed publications and DNB thesis on critical care, metabolic liver disease and cardiovascular health.",
  path: "/research",
});

const focusAreas = [
  ["Metabolic and liver health", "Clinical questions around metabolic dysfunction-associated steatotic liver disease (MASLD), diabetes, obesity and the practical management of related cardiometabolic risk."],
  ["Critical-care innovation", "Evidence-based approaches to acute care, airway management and safer, resource-conscious interventions in intensive-care settings."],
  ["Cardiovascular implications", "The relationship between metabolic disease, body composition and structural or functional changes in cardiovascular health."],
];

export default function ResearchPage() {
  return <main className="research-page">
    <div className="info-strip"><span>Research and academic contributions · Internal Medicine</span><strong>For a medical emergency, visit the nearest emergency department.</strong></div>
    <header className="site-header"><a className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a><nav aria-label="Research navigation"><a href="/">Home</a><a href="/about-dr-kulwant-yadav">About</a><a href="/conditions">Conditions</a><a href="/services">Services</a><a href="/health-library">Health library</a></nav><a className="header-cta" href="/book-appointment">Book appointment</a></header>

    <section className="research-hero"><div><a className="back-link" href="/">← Back to home</a><p className="eyebrow"><span/> Research and academic contributions</p><h1>Clinical questions, pursued with <em>rigour and purpose.</em></h1><p>Dr. Kulwant Yadav is committed to advancing medical science and improving patient outcomes through clinically relevant research. His academic work connects evidence-based Internal Medicine, critical-care interventions and the cardiovascular and hepatic implications of metabolic disease.</p></div><div className="research-hero-visual"><img src="/research-hero-dr-kulwant.png" alt="Dr. Kulwant Yadav reviewing medical research at his desk"/><aside><span>Academic focus</span><strong>Research that connects bedside decisions with better evidence.</strong><small>Published work, ongoing clinical research and postgraduate scholarship.</small></aside></div></section>

    <section className="research-introduction section"><div><p className="section-label">Research profile</p><h2>Evidence should make care <em>clearer, safer and more practical.</em></h2></div><div><p>Clinical research is most useful when it answers a meaningful question: how a treatment performs in routine practice, how a high-risk procedure can be safer, or how connected metabolic factors affect long-term health. Dr. Yadav's work is shaped by those questions.</p><p>This page brings together current research activity, peer-reviewed publications and postgraduate academic work. It is intended for patients, colleagues and collaborators who would like to understand the academic interests that inform his wider clinical perspective.</p></div></section>

    <section className="research-focus section"><div className="research-section-heading"><p className="section-label">Areas of interest</p><h2>A multidisciplinary view of adult medical care.</h2></div><div className="research-focus-grid">{focusAreas.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section className="ongoing-research section"><div className="research-section-heading"><p className="section-label">Ongoing clinical research</p><h2>Real-world evidence in <em>MASLD care.</em></h2></div><article className="study-card"><div className="study-card-meta"><img src="/research-masld-study.png" alt="Clinical research materials representing a multicentre MASLD observational study"/><div><span>Ongoing study</span><strong>Multicentre retrospective observational study</strong></div></div><div><h3>Real-World Effectiveness of Saroglitazar in Women with MASLD</h3><p className="study-subtitle">A real-world evidence study examining Saroglitazar 4 mg in female patients with metabolic dysfunction-associated steatotic liver disease.</p><p>This active multicentre, retrospective observational study is designed to understand treatment effectiveness in routine clinical practice. Its clinical focus is the evaluation of changes related to liver fat and fibrosis in women with MASLD, alongside the broader metabolic context in which the condition is managed.</p><dl><div><dt>Population</dt><dd>Women with MASLD in real-world clinical settings</dd></div><div><dt>Study approach</dt><dd>Multicentre, retrospective observational analysis</dd></div><div><dt>Clinical question</dt><dd>How Saroglitazar 4 mg performs in day-to-day practice</dd></div></dl></div></article>
    </section>

    <section className="publications-section section"><div className="research-section-heading"><p className="section-label">Peer-reviewed publications</p><h2>Published work in critical care and cardiovascular medicine.</h2></div><div className="publication-list">
      <article><div className="publication-number">01</div><div><p className="publication-type">Critical care · 2025</p><h3>Chawla's Modified Griggs Percutaneous Tracheostomy: A Safe, Cost-Effective Alternative for Resource-Limited ICUs</h3><p className="citation">International Journal of Critical Illness and Injury Science. 2025;15(4):157–162.</p><p>This publication examines an innovative and cost-conscious approach to percutaneous tracheostomy, with relevance for critical-care teams working in resource-limited intensive-care settings.</p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC13178837/" target="_blank" rel="noopener noreferrer">Read the publication on PubMed Central <span>↗</span></a></div></article>
      <article><div className="publication-number">02</div><div><p className="publication-type">Cardiovascular critical care · 2023</p><h3>A Rare Case of Pulseless Ventricular Tachycardia During Central Venous Catheter Insertion</h3><p className="citation">Journal of Cardiovascular Disease Research. 2023.</p><p>This clinical case study focuses on recognising and managing an uncommon but life-threatening complication during a routinely performed critical-care procedure.</p><a href="https://jcdronline.org/index.php/JCDR/article/view/7890" target="_blank" rel="noopener noreferrer">Read the publication in the journal <span>↗</span></a></div></article>
    </div></section>

    <section className="thesis-section section"><div className="thesis-intro"><p className="section-label">Academic thesis</p><h2>Metabolic health and the <em>heart.</em></h2><img src="/research-metabolic-heart.png" alt="Heart model and echocardiography study materials representing metabolic and cardiovascular research"/></div><article><span>DNB thesis</span><h3>Echocardiographic Changes in Patients with Type 2 Diabetes Mellitus in Relation to Body Mass Index and Waist–Hip Ratio</h3><p>This postgraduate study explores the intersection of type 2 diabetes, body composition and cardiovascular health. It considers how metabolic syndrome and lifestyle-related risk factors may relate to structural heart changes identified through echocardiography.</p><p>Its central theme remains highly relevant to modern Internal Medicine: metabolic disease is rarely confined to one organ system, and meaningful assessment often requires attention to the connected health of the heart, liver, kidneys and wider cardiovascular system.</p></article></section>

    <section className="research-note section"><div><h2>Research is part of a broader commitment to thoughtful care.</h2><p>Academic activity complements, rather than replaces, individual clinical assessment. Treatment and investigation decisions are always based on a patient's symptoms, examination, history, investigations and clinical judgement.</p></div><div><a className="text-link" href="/health-library">Explore patient education guides →</a><a className="text-link" href="/services">Explore Internal Medicine services →</a></div></section>
    <ConsultationActions tone="navy" />
    <SiteFooter />
  </main>;
}
