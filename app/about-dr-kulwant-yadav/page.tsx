import type { Metadata } from "next";
import SocialFollow from "../SocialFollow";
import ConsultationActions from "../ConsultationActions";
import { pageMetadata } from "../seo";

export const metadata: Metadata = pageMetadata({
  title: "Doctor Profile, Qualifications and Experience",
  description: "Learn about Dr. Kulwant Yadav’s Internal Medicine qualifications, clinical philosophy, critical-care background, certifications and clinical focus in Bhiwadi.",
  path: "/about-dr-kulwant-yadav",
});

const qualifications = [
  ["DNB", "General Medicine", "NBEMS, New Delhi"],
  ["FRCEM", "Primary examination", "Royal College of Emergency Medicine, United Kingdom · 2019"],
  ["DCMH", "Diploma in Community Mental Health", "NIMHANS, Bengaluru · 2018"],
  ["MBBS", "Bachelor of Medicine and Bachelor of Surgery", "U.P. University of Medical Sciences, Saifai · 2008"],
];

export default function AboutPage() {
  return <main className="about-page">
    <div className="info-strip"><span>Consultant in Internal Medicine · Bhiwadi</span><strong>For a medical emergency, visit the nearest emergency department.</strong></div>
    <header className="site-header">
      <a className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
      <nav aria-label="Profile navigation"><a href="/">Home</a><a href="#philosophy">Philosophy</a><a href="#qualifications">Qualifications</a><a href="#clinical-focus">Clinical focus</a><a href="#practice">Practice</a></nav>
      <a className="header-cta" href="/book-appointment">Book appointment</a>
    </header>

    <section className="about-hero">
      <div className="about-hero-copy"><a className="back-link" href="/">← Back to home</a><p className="eyebrow"><span/> About Dr. Kulwant Yadav</p><h1>Internal medicine with a <em>whole-person perspective.</em></h1><p>Dr. Kulwant Yadav is a Consultant in Internal Medicine serving adults in Bhiwadi. His work brings together general medicine, chronic disease care, emergency assessment and critical-care experience to help patients understand complex or overlapping health concerns.</p><div className="about-credentials"><span>MBBS</span><span>DNB General Medicine</span><span>FRCEM (Primary)</span><span>DCMH, NIMHANS</span></div></div>
      <div className="about-hero-photo"><img src="/dr-kulwant-yadav-clinic.png" alt="Dr. Kulwant Yadav, Consultant in Internal Medicine"/></div>
    </section>

    <section className="profile-section section" id="philosophy"><div className="profile-number">01</div><div><div className="section-label">Professional introduction</div><h2>A physician for the complete adult-health picture.</h2></div><div className="profile-copy"><p>Internal Medicine is the formal medical specialty concerned with prevention, diagnosis and non-surgical management of adult disease. Dr. Yadav’s practice is grounded in this broad, systems-based approach.</p><p>He evaluates common illnesses as well as cases in which several symptoms, medicines or chronic conditions interact. When care requires another specialty, he helps identify the need for timely referral and coordinated follow-up.</p></div></section>

    <section className="profile-section section alt" id="clinical-philosophy"><div className="profile-number">02</div><div><div className="section-label">Clinical philosophy</div><h2>Listen carefully. Investigate appropriately. Explain clearly.</h2></div><div className="profile-copy"><p>A consultation begins with the patient’s story: symptoms, medical history, daily routine, medicines, risks and priorities. Investigations are selected to answer a clinical question—not simply to generate more reports.</p><p>The goal is a practical plan that patients can understand and follow, with monitoring and modification as health needs change.</p></div></section>

    <section className="profile-credentials section" id="qualifications"><div className="section-label"><span>03</span> Qualifications</div><h2>Formal medical education</h2><div className="credential-list">{qualifications.map(([abbr,title,place])=><div className="credential" key={abbr}><b>{abbr}</b><strong>{title}</strong><span>{place}</span></div>)}</div><p className="verification-note">Exact qualification wording and permitted designations should be checked against original certificates before public launch.</p></section>

    <section className="support-grid section"><article><span>04</span><h2>Advanced life-support certifications</h2><p>Certified Basic Life Support (BLS) and Advanced Cardiovascular Life Support (ACLS) provider through the American Heart Association, completed at Max Institute of Excellence, New Delhi.</p></article><article><span>05</span><h2>Internal medicine and critical-care experience</h2><p>Experience across general medicine, acute medical emergencies, trauma response, resuscitation and high-stakes critical-care environments informs his approach to early recognition and safe escalation.</p></article><article><span>07</span><h2>Mental-health training</h2><p>A Diploma in Community Mental Health from NIMHANS supports informed assessment of common mental-health and sleep-related concerns within general medical care.</p></article><article id="research"><span>08</span><h2>Research interests</h2><p>Research interests include metabolic dysfunction-associated fatty liver disease, cardiovascular effects of diabetes and obesity, evidence-based critical care and practical interventions for resource-limited intensive-care settings.</p></article></section>

    <section className="scope-section section" id="clinical-focus"><div className="section-label light"><span>06</span> Clinical focus and scope</div><h2>Clear boundaries. Coordinated care.</h2><p className="scope-intro">Dr. Yadav’s formal specialty is Internal Medicine. The categories below explain what that means without implying certification in another medical specialty.</p><div className="scope-grid"><article><span>Formal medical specialty</span><h3>Internal Medicine</h3><p>Comprehensive non-surgical medical care for adults, including prevention, diagnosis, treatment planning and chronic-disease follow-up.</p></article><article><span>Conditions managed within Internal Medicine</span><h3>Adult medical and multi-system conditions</h3><p>Diabetes, high blood pressure, metabolic and fatty liver disease, obesity-related conditions, kidney-function concerns, digestive symptoms, infections, asthma, headaches, seizures, sleep concerns and complex overlapping conditions.</p></article><article><span>Additional training and clinical interests</span><h3>Emergency care, mental health and metabolic medicine</h3><p>FRCEM Primary, community mental-health training, critical-care experience, and research interests in metabolic, cardiovascular and liver health are additional qualifications or interests—not separate specialist registrations.</p></article><article><span>Procedures and diagnostics</span><h3>Assessment and diagnostic guidance</h3><p>Clinical consultation, preventive evaluation, report review and cardiovascular diagnostic interpretation. Direct availability, equipment location and reporting arrangements for ECG or echocardiography must be confirmed before booking.</p></article><article className="referral-card"><span>Conditions that may require referral</span><h3>Specialist or emergency escalation when appropriate</h3><p>Some heart, brain, kidney, psychiatric, gastrointestinal, liver, lung or surgical conditions require a cardiologist, neurologist, nephrologist, psychiatrist, gastroenterologist, hepatologist, pulmonologist, surgeon or emergency department. Referral depends on clinical findings, severity and required procedures.</p></article></div></section>

    <section className="details-section section" id="practice"><div><div className="section-label"><span>09–11</span> Practice details</div><h2>Clinical affiliation in Bhiwadi</h2><p>Dr. Yadav serves as Honorary Consultant Internal Medicine at Gopinath Hospital and contributes to preventive-health screening and community outreach initiatives.</p></div><dl><div><dt>Languages spoken</dt><dd>To be confirmed</dd></div><div><dt>Medical registration number and council</dt><dd>To be confirmed from current registration documentation</dd></div><div><dt>Current practice location</dt><dd>Gopinath Hospital, H-226, Industrial Area, near Ramphal Cinema, Bhiwadi – 301019, Alwar, Rajasthan</dd></div><div><dt>Contact</dt><dd><a href="tel:+919205775932">+91 92057 75932</a> · <a href="https://wa.me/919205775932" target="_blank" rel="noopener noreferrer">WhatsApp</a></dd></div></dl></section>

    <ConsultationActions tone="teal" />

    <footer><div className="footer-main"><a className="brand footer-brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a><p>Evidence-based adult medical care in Bhiwadi.</p></div><div className="footer-links"><div><strong>Profile</strong><a href="#philosophy">Clinical philosophy</a><a href="#qualifications">Qualifications</a><a href="#clinical-focus">Clinical focus</a><a href="#practice">Practice details</a></div><div><strong>Website</strong><a href="/">Home</a><a href="/#conditions">Conditions</a><a href="/health-library">Health library</a><a href="/policies">Policies</a></div></div><SocialFollow/><small>© {new Date().getFullYear()} Dr. Kulwant Yadav. Information is educational and does not replace an individual medical consultation.</small></footer>
  </main>;
}
