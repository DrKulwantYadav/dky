"use client";

import { useEffect, useState } from "react";

const campaignEndsAt = new Date("2026-09-29T23:59:59+05:30").getTime();

export default function WorldHeartCampSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setVisible(Date.now() <= campaignEndsAt);
    }

    updateVisibility();
    const timer = window.setInterval(updateVisibility, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!visible) return null;

  return <section className="home-heart-camp" aria-labelledby="home-heart-camp-title">
    <div className="home-heart-camp-image">
      <img src="/dr-kulwant-yadav-portrait.png" alt="Dr. Kulwant Yadav, Consultant Internal Medicine"/>
      <div className="home-heart-camp-date"><small>Free camp</small><strong>Every Sunday</strong><span>06 · 13 · 20 · 27 September</span></div>
    </div>
    <div className="home-heart-camp-copy">
      <p className="section-label light"><span>Heart-health initiative</span> September 2026</p>
      <h2 id="home-heart-camp-title">Don&apos;t miss a beat.<br/><em>Get your free heart check-up.</em></h2>
      <p>Join Dr. Kulwant Yadav at Gopinath Hospital, Bhiwadi, for free ECG screening, blood-pressure and BMI checks, heart-risk review and direct medical guidance.</p>
      <div className="home-heart-camp-meta"><span><small>Camp hours</small><strong>9:00 am – 1:00 pm</strong></span><span><small>Location</small><strong>Gopinath Hospital</strong></span></div>
      <a href="/world-heart-day-free-ecg-camp">Explore the free camp <span>→</span></a>
    </div>
  </section>;
}
