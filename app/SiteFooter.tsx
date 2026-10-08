import SocialFollow from "./SocialFollow";
import { conditionProfiles } from "./conditions/data";
import { serviceProfiles } from "./services/data";
import { libraryTopics } from "./health-library/data";
import Link from "next/link";

export default function SiteFooter({ reviewed = true, language = "en" }: { reviewed?: boolean; language?: "en" | "hi" }) {
  if (language === "hi") return <footer>
    <div className="footer-main"><Link className="brand footer-brand" href="/"><span className="brand-mark">KY</span><span><strong>डॉ. कुलवंत यादव</strong><small>आंतरिक चिकित्सा सलाहकार</small></span></Link><p>भिवाड़ी में वयस्कों के लिए प्रमाण-आधारित चिकित्सा देखभाल।</p></div>
    <div className="footer-links"><div><strong>क्लिनिक</strong><Link href="/clinic-bhiwadi">स्थान और रास्ता</Link><a href="tel:+919205775932">समय पूछने के लिए कॉल करें</a><Link href="/conditions/diabetes#faqs">अक्सर पूछे जाने वाले सवाल</Link></div><div><strong>कानूनी जानकारी और गोपनीयता</strong><Link href="/policies#privacy">गोपनीयता नीति</Link><Link href="/policies#terms">उपयोग की शर्तें</Link><Link href="/policies#medical-disclaimer">चिकित्सा अस्वीकरण</Link></div><div><strong>वेबसाइट पेज</strong><Link href="/about-dr-kulwant-yadav">डॉ. यादव के बारे में</Link><Link href="/conditions">स्वास्थ्य विषय</Link><Link href="/services">चिकित्सा सेवाएँ</Link><Link href="/health-library">स्वास्थ्य जानकारी</Link><Link href="/clinic-bhiwadi">भिवाड़ी क्लिनिक</Link><Link href="/book-appointment">अपॉइंटमेंट के लिए संपर्क करें</Link></div></div>
    <section className="footer-directory" aria-label="स्वास्थ्य जानकारी और सेवाएँ"><div><strong>संबंधित विषय</strong><nav><Link href="/conditions/diabetes">मधुमेह</Link><Link href="/conditions/hypertension">उच्च रक्तचाप</Link><Link href="/conditions/kidney-disease">गुर्दों की सेहत</Link><Link href="/conditions/fatty-liver-masld">फैटी लिवर</Link></nav></div><div><strong>सेवाएँ</strong><nav><Link href="/services/internal-medicine">आंतरिक चिकित्सा</Link><Link href="/services/chronic-disease">पुरानी बीमारियों की देखभाल</Link><Link href="/services/report-review">रिपोर्ट की समीक्षा</Link></nav></div><div><strong>रोगी जानकारी</strong><nav><Link href="/health-library/diabetes-when-to-consult-a-physician">मधुमेह में डॉक्टर से कब मिलें?</Link><Link href="/health-library/fatty-liver-and-metabolic-health">फैटी लिवर और चयापचय सेहत</Link></nav></div></section>
    <SocialFollow reviewed={reviewed} language="hi" />
    <small>© {new Date().getFullYear()} डॉ. कुलवंत यादव। यह जानकारी शिक्षा के लिए है और व्यक्तिगत चिकित्सा परामर्श का विकल्प नहीं है।</small>
  </footer>;
  return <footer>
    <div className="footer-main">
      <a className="brand footer-brand" href="/#home"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
      <p>Evidence-based adult medical care in Bhiwadi.</p>
    </div>
    <div className="footer-links">
      <div><strong>Visit</strong><a href="/#contact">Clinic Location</a><a href="/#contact">Consultation Timings</a><a href="/#faq">Frequently Asked Questions</a><a href="/#contact">Emergency Guidance</a></div>
      <div><strong>Legal & privacy</strong><a href="/policies#privacy">Privacy Policy</a><a href="/policies#terms">Terms of Use</a><a href="/policies#medical-disclaimer">Medical Disclaimer</a><a href="/policies#cancellation">Appointment Cancellation Policy</a><a href="/policies#data-request">Data Request / Privacy Contact</a></div>
      <div><strong>Practice pages</strong><a href="/about-dr-kulwant-yadav">About Dr. Kulwant Yadav</a><a href="/conditions">Conditions treated</a><a href="/services">Internal Medicine services</a><a href="/research">Research and academic contributions</a><a href="/health-library">Health library</a><a href="/community-initiatives">Community activities</a><a href="/clinic-bhiwadi">Clinic in Bhiwadi</a><a href="/book-appointment">Book an appointment</a><a href="/world-heart-day-free-ecg-camp">Free ECG camp information</a></div>
    </div>
    <section className="footer-directory" aria-label="Explore medical information and services">
      <div><strong>Condition guides</strong><nav>{Object.entries(conditionProfiles).map(([slug, condition]) => <a href={`/conditions/${slug}`} key={slug}>{condition.title}</a>)}</nav></div>
      <div><strong>Clinical services</strong><nav>{serviceProfiles.map((service) => <a href={`/services/${service.id}`} key={service.id}>{service.title}</a>)}</nav></div>
      <div><strong>Patient education</strong><nav>{libraryTopics.map((topic) => <a href={`/health-library/${topic.slug}`} key={topic.slug}>{topic.title}</a>)}</nav></div>
    </section>
    <SocialFollow reviewed={reviewed} language="en" />
    <small>© {new Date().getFullYear()} Dr. Kulwant Yadav. Information is educational and does not replace an individual medical consultation.</small>
  </footer>;
}
