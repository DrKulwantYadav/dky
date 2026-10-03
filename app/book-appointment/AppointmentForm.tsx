const whatsappMessage = "Hello, I would like to request an appointment with Dr. Kulwant Yadav. Please share the available timings.";
const whatsappUrl = `https://wa.me/919205775932?text=${encodeURIComponent(whatsappMessage)}`;

export default function AppointmentForm() {
  return <section className="appointment-contact" aria-labelledby="appointment-contact-title">
    <span className="appointment-contact-eyebrow">Appointment requests</span>
    <h2 id="appointment-contact-title">Contact the clinic to book</h2>
    <p>Online appointment submissions are not available yet. Call or send a WhatsApp message to ask about available dates and times. Your appointment is confirmed only when the clinic replies.</p>
    <div className="appointment-contact-actions">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Request on WhatsApp <span aria-hidden="true">↗</span></a>
      <a href="tel:+919205775932">Call +91 92057 75932 <span aria-hidden="true">↗</span></a>
    </div>
    <small>Please do not include detailed medical history or reports in your initial WhatsApp message. For an emergency, seek immediate medical care.</small>
  </section>;
}
