import type {Metadata} from "next";
import {libraryTopics} from "./data";
import ConsultationActions from "../ConsultationActions";
import {pageMetadata} from "../seo";
import SiteFooter from "../SiteFooter";

export const metadata:Metadata=pageMetadata({title:"Health Library | Doctor-Reviewed Patient Guides",description:"Read doctor-reviewed, patient-friendly guides from Dr. Kulwant Yadav covering diabetes, blood pressure, fatty liver and other common adult health concerns.",path:"/health-library"});

export default function Library(){return <main className="library-page">
  <header className="simple-header"><a className="brand" href="/"><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a><nav><a href="/">Home</a><a href="/conditions">Conditions</a><a href="/services">Services</a></nav><a href="/book-appointment" className="header-cta">Book appointment</a></header>
  <section className="library-hero"><div><p className="eyebrow"><span/> Patient education</p><h1>Doctor-reviewed health guides <em>for patients.</em></h1><p>Patient-friendly articles that explain common adult health concerns and help you prepare for a useful medical conversation.</p></div><aside><span>Health library</span><strong>{String(libraryTopics.length).padStart(2,"0")}</strong><small>Practical topic guides</small></aside></section>
  <section className="library-index"><div className="library-index-head"><div><p className="section-label"><span>01</span> Browse topics</p><h2>Latest health guides</h2></div><p>Choose a topic to read the full guide. New articles can be added here as the library grows.</p></div>
    <div className="library-grid">{libraryTopics.map((topic,index)=><a className="library-card" href={`/health-library/${topic.slug}`} key={topic.slug}><div className="library-card-top"><span>{topic.category}</span><b>{String(index+1).padStart(2,"0")}</b></div><h3>{topic.title}</h3><p>{topic.summary}</p><div><small>{topic.readTime}</small><strong>Read article <i>→</i></strong></div></a>)}</div>
  </section>
  <section className="library-note"><strong>Educational information, not individual diagnosis</strong><p>These articles provide general health education. Symptoms, test results and treatment choices should be discussed with a qualified clinician who knows your medical history.</p></section>
  <ConsultationActions tone="ivory" />
  <SiteFooter />
</main>}
