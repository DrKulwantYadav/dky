import SocialFollow from "./SocialFollow";

export default function SiteFooter() {
  return <footer>
    <div className="footer-main">
      <a className="brand footer-brand" href="/#home"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
      <p>Evidence-based adult medical care in Bhiwadi.</p>
    </div>
    <div className="footer-links">
      <div><strong>Visit</strong><a href="/#contact">Clinic Location</a><a href="/#contact">Consultation Timings</a><a href="/#faq">Frequently Asked Questions</a><a href="/#contact">Emergency Guidance</a></div>
      <div><strong>Legal & privacy</strong><a href="/policies#privacy">Privacy Policy</a><a href="/policies#terms">Terms of Use</a><a href="/policies#medical-disclaimer">Medical Disclaimer</a><a href="/policies#cancellation">Appointment Cancellation Policy</a><a href="/policies#data-request">Data Request / Privacy Contact</a></div>
    </div>
    <SocialFollow />
    <small>© {new Date().getFullYear()} Dr. Kulwant Yadav. Information is educational and does not replace an individual medical consultation.</small>
  </footer>;
}
