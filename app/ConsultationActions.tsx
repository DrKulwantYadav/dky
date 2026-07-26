type ConsultationActionsProps = {
  tone?: "navy" | "teal" | "ivory";
};

export default function ConsultationActions({ tone = "ivory" }: ConsultationActionsProps) {
  return <section className={`site-consultation-actions tone-${tone}`} aria-label="Consultation options at Gopinath Hospital">
    <div className="site-consultation-heading">
      <span>Consultations at Gopinath Hospital</span>
      <h2>Choose the most convenient way to connect.</h2>
    </div>
    <div className="site-consultation-grid">
      <a className="site-consultation-primary" href="/book-appointment"><strong>Request a consultation</strong><small>Choose a preferred date and time</small><b>→</b></a>
      <a href="tel:+919205775932"><strong>Call the clinic</strong><small>+91 92057 75932</small><b>☎</b></a>
      <a href="https://wa.me/919205775932" target="_blank" rel="noopener noreferrer"><strong>Message on WhatsApp</strong><small>Ask about appointments and availability</small><b>↗</b></a>
      <a href="https://maps.app.goo.gl/W9QHHQxRkA5bGasi7" target="_blank" rel="noopener noreferrer"><strong>Get directions</strong><small>Gopinath Hospital, Bhiwadi</small><b>⌖</b></a>
    </div>
    <small className="site-consultation-emergency">For urgent or life-threatening symptoms, visit the nearest emergency department immediately.</small>
  </section>;
}
