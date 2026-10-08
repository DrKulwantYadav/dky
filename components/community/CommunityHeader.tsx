import Link from "next/link";

export default function CommunityHeader() {
  return <header className="site-header community-header">
    <Link className="brand" href="/"><span className="brand-mark">KY</span><span><strong>Dr. Kulwant Yadav</strong><small>Consultant Internal Medicine</small></span></Link>
    <nav aria-label="Primary navigation"><Link href="/">Home</Link><Link href="/about-dr-kulwant-yadav">About</Link><Link href="/conditions">Conditions</Link><Link href="/services">Services</Link><Link href="/community-initiatives" aria-current="page">Community activities</Link><Link href="/health-library">Health library</Link></nav>
    <Link className="header-cta" href="/book-appointment">Book appointment</Link>
  </header>;
}
