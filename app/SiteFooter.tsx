import SocialFollow from "./SocialFollow";
import { conditionProfiles } from "./conditions/data";
import { serviceProfiles } from "./services/data";
import { libraryTopics } from "./health-library/data";

export default function SiteFooter() {
  return <footer>
    <div className="footer-main">
      <a className="brand footer-brand" href="/#home"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
      <p>Evidence-based adult medical care in Bhiwadi.</p>
    </div>
    <div className="footer-links">
      <div><strong>Visit</strong><a href="/#contact">Clinic Location</a><a href="/#contact">Consultation Timings</a><a href="/#faq">Frequently Asked Questions</a><a href="/#contact">Emergency Guidance</a></div>
      <div><strong>Legal & privacy</strong><a href="/policies#privacy">Privacy Policy</a><a href="/policies#terms">Terms of Use</a><a href="/policies#medical-disclaimer">Medical Disclaimer</a><a href="/policies#cancellation">Appointment Cancellation Policy</a><a href="/policies#data-request">Data Request / Privacy Contact</a></div>
      <div><strong>Practice pages</strong><a href="/about-dr-kulwant-yadav">About Dr. Kulwant Yadav</a><a href="/conditions">Conditions treated</a><a href="/services">Internal Medicine services</a><a href="/research">Research and academic contributions</a><a href="/health-library">Health library</a><a href="/clinic-bhiwadi">Clinic in Bhiwadi</a><a href="/book-appointment">Book an appointment</a><a href="/world-heart-day-free-ecg-camp">Free ECG camp information</a></div>
    </div>
    <section className="footer-directory" aria-label="Explore medical information and services">
      <div><strong>Condition guides</strong><nav>{Object.entries(conditionProfiles).map(([slug, condition]) => <a href={`/conditions/${slug}`} key={slug}>{condition.title}</a>)}</nav></div>
      <div><strong>Clinical services</strong><nav>{serviceProfiles.map((service) => <a href={`/services/${service.id}`} key={service.id}>{service.title}</a>)}</nav></div>
      <div><strong>Patient education</strong><nav>{libraryTopics.map((topic) => <a href={`/health-library/${topic.slug}`} key={topic.slug}>{topic.title}</a>)}</nav></div>
    </section>
    <SocialFollow />
    <small>© {new Date().getFullYear()} Dr. Kulwant Yadav. Information is educational and does not replace an individual medical consultation.</small>
  </footer>;
}
