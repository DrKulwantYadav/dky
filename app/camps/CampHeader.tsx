/* eslint-disable @next/next/no-html-link-for-pages -- Leaving the camp privacy boundary must start a fresh document. */
import Link from "next/link";

export default function CampHeader() {
  return <>
    <div className="info-strip"><span>Health camps · Bhiwadi</span><strong>Registration is free</strong></div>
    <header className="site-header">
      <a className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></a>
      <nav aria-label="Camp navigation"><a href="/">Home</a><Link href="/camps">Health Camps</Link><a href="/book-appointment">Regular appointment</a></nav>
      <a className="call-link" href="tel:+919205775932">Call clinic</a>
    </header>
  </>;
}
