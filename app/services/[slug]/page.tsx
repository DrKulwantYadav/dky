import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getServiceProfile,serviceProfiles} from "../data";
import ConsultationActions from "../../ConsultationActions";
import JsonLd from "../../JsonLd";
import {breadcrumbSchema, medicalWebPageSchema, pageMetadata, physicianId, siteUrl} from "../../seo";
import SiteFooter from "../../SiteFooter";

export function generateStaticParams(){return serviceProfiles.map(({id})=>({slug:id}))}
const serviceSeo:Record<string,{title:string;description:string}>={
  "internal-medicine":{title:"Internal Medicine Consultation in Bhiwadi",description:"Book an Internal Medicine consultation with Dr. Kulwant Yadav in Bhiwadi for new symptoms, complex conditions, medicine review and coordinated adult medical care."},
  "chronic-disease":{title:"Chronic Disease Management in Bhiwadi",description:"Coordinated Internal Medicine follow-up for diabetes, hypertension, fatty liver, kidney risk and other long-term conditions in Bhiwadi."},
  "weight-management":{title:"Medical Weight Management in Bhiwadi",description:"Medical weight-management assessment in Bhiwadi covering metabolic risk, obesity-related conditions, lifestyle factors and appropriate treatment options."},
  "preventive-health":{title:"Preventive Health and Metabolic Screening in Bhiwadi",description:"Personalised preventive health assessment in Bhiwadi based on age, medical history, lifestyle, family history and cardiometabolic risk."},
  ecg:{title:"When an ECG May Be Recommended",description:"Learn when an ECG may be clinically recommended, how it is interpreted in context and why availability must be confirmed with the clinic."},
  echocardiography:{title:"When Echocardiography May Be Recommended",description:"Learn when echocardiography may be clinically recommended and when referral to an appropriate diagnostic facility or specialist is needed."},
  "report-review":{title:"Medical Report Review and Follow-Up in Bhiwadi",description:"Review blood tests, imaging reports, treatment response and previous prescriptions with Dr. Kulwant Yadav as part of Internal Medicine follow-up in Bhiwadi."},
  teleconsultation:{title:"Teleconsultation Availability and Safety Information",description:"Learn when remote consultation may be suitable and why availability, consent and emergency arrangements must be confirmed directly with the clinic."},
};
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const service=getServiceProfile(slug);const seo=serviceSeo[slug];return service?pageMetadata({title:seo?.title||service.title,description:seo?.description||service.lead,path:`/services/${service.id}` }):{title:"Service not found",robots:{index:false,follow:false}}}

export default async function ServicePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const service=getServiceProfile(slug);if(!service)notFound();const related=serviceProfiles.filter(item=>item.id!==service.id).slice(0,3);const seo=serviceSeo[slug];const path=`/services/${service.id}`;const schemas:Record<string,unknown>[]=[medicalWebPageSchema({name:seo?.title||service.title,description:seo?.description||service.lead,path,about:service.title}),breadcrumbSchema([{name:"Home",path:"/"},{name:"Services",path:"/services"},{name:service.title,path}])];if(!service.verify){schemas.push({"@context":"https://schema.org","@type":"Service",name:service.title,description:service.lead,url:`${siteUrl}${path}`,provider:{"@id":physicianId},areaServed:{"@type":"City",name:"Bhiwadi"}})}return <main className="service-profile-page">
  <JsonLd data={schemas} />
  <div className="info-strip"><span>Internal Medicine services · Bhiwadi</span><strong>Medical emergency? Visit the nearest emergency department.</strong></div>
  <header className="site-header"><a className="brand" href="/"><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a><nav><a href="/">Home</a><a href="/about-dr-kulwant-yadav">About</a><a href="/conditions">Conditions</a><a href="/services">Services</a><a href="/health-library">Health library</a></nav><a href="/book-appointment" className="header-cta">Book appointment</a></header>
  <section className="service-profile-hero"><div><a className="back-link" href="/services">← All services</a><p className="eyebrow"><span/> Service {service.n}</p><h1>{service.title}</h1><p>{service.lead}</p><a className="primary-button" href="/book-appointment">Book an appointment <span>→</span></a></div><aside><span>Availability</span><strong>{service.status}</strong></aside></section>
  <section className="service-profile-intro"><p className="section-label"><span>Overview</span> About this service</p><div><h2>Care begins with the clinical question.</h2><p>{service.body}</p></div></section>
  <section className="service-profile-grid"><article><span>01</span><h2>Who this may suit</h2><ul>{service.bestFor.map(item=><li key={item}>{item}</li>)}</ul></article><article><span>02</span><h2>What the service may include</h2><ul>{service.includes.map(item=><li key={item}>{item}</li>)}</ul></article><article><span>03</span><h2>How to prepare</h2><ul>{service.preparation.map(item=><li key={item}>{item}</li>)}</ul></article><article><span>04</span><h2>Possible next steps</h2><ul>{service.nextSteps.map(item=><li key={item}>{item}</li>)}</ul></article></section>
  {service.verify&&<section className="service-verification"><strong>Please confirm before travelling</strong><p>{service.status}. Contact the clinic to confirm suitability, location, timing, equipment and reporting arrangements.</p></section>}
  <section className="service-related"><div><p className="section-label"><span>Explore</span> Other services</p><h2>Related clinical services</h2></div><div>{related.map(item=><a href={`/services/${item.id}`} key={item.id}><span>{item.n}</span><strong>{item.title}</strong><small>View details →</small></a>)}</div></section>
  <ConsultationActions tone="navy" />
  <section className="medical-disclaimer"><strong>Important information</strong><p>Service availability, fees, diagnostic location and reporting arrangements must be confirmed directly with the clinic. This page provides general information and does not replace individual medical assessment.</p></section>
  <SiteFooter />
</main>}
