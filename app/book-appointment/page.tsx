import type { Metadata } from "next";
import AppointmentForm from "./AppointmentForm";
import SocialFollow from "../SocialFollow";
import ConsultationActions from "../ConsultationActions";
import { pageMetadata } from "../seo";

export const metadata:Metadata=pageMetadata({title:"Book an Internal Medicine Appointment",description:"Request an Internal Medicine consultation with Dr. Kulwant Yadav at Gopinath Hospital in Bhiwadi. Appointment requests require confirmation from the clinic.",path:"/book-appointment"});

export default function BookAppointmentPage(){return <main className="booking-page">
  <div className="info-strip"><span>Appointment request · Bhiwadi</span><strong>This form is not monitored for emergencies.</strong></div>
  <header className="site-header"><a className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a><nav><a href="/">Home</a><a href="/conditions">Conditions</a><a href="/services">Services</a><a href="/about-dr-kulwant-yadav">About</a></nav><a className="call-link" href="tel:+919205775932">Call clinic</a></header>
  <section className="booking-shell">
    <div className="booking-intro"><a className="back-link" href="/">← Back to home</a><p className="eyebrow"><span/> Book appointment</p><h1>Consultations at Gopinath Hospital.</h1><p>Choose your preferred date and time. The clinic will contact you to confirm availability.</p><div className="booking-facts"><div><span>Consultation type</span><strong>Adult Internal Medicine</strong></div><div><span>Practice location</span><strong>Gopinath Hospital, Bhiwadi</strong></div><div><span>Call / WhatsApp</span><strong><a href="tel:+919205775932">+91 92057 75932</a></strong></div><div><span>Confirmation</span><strong>Required from the clinic</strong></div></div><div className="booking-emergency"><strong>Medical emergency?</strong><p>This form is not monitored for emergencies. For severe chest pain, breathing difficulty, unconsciousness, stroke symptoms, major injury or another medical emergency, seek immediate emergency care.</p></div></div>
    <AppointmentForm/>
  </section>
  <ConsultationActions tone="ivory" />
  <footer><div className="footer-main"><a className="brand footer-brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a><p>Evidence-based adult medical care in Bhiwadi.</p></div><div className="footer-links"><div><strong>Explore</strong><a href="/conditions">Conditions</a><a href="/services">Services</a><a href="/about-dr-kulwant-yadav">About Dr. Yadav</a></div><div><strong>Privacy</strong><a href="/policies#privacy">Privacy policy</a><a href="/policies#cancellation">Cancellation policy</a><a href="/policies#medical-disclaimer">Medical disclaimer</a></div></div><SocialFollow/><small>© {new Date().getFullYear()} Dr. Kulwant Yadav. An appointment request is not confirmed until the clinic responds.</small></footer>
</main>}
