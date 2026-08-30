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
    <div className="home-heart-camp-date">
      <small>Free camp · September 2026</small>
      <strong>Every<br/>Sunday</strong>
      <div><span>06</span><span>13</span><span>20</span><span>27</span></div>
      <b>9:00 am – 1:00 pm</b>
    </div>
    <div className="home-heart-camp-copy">
      <p className="section-label light"><span>Heart-health initiative</span> September 2026</p>
      <h2 id="home-heart-camp-title">Free ECG &amp; <em>heart check-up camp.</em></h2>
      <p>Free ECG screening, blood-pressure and BMI checks, heart-risk review and direct medical guidance at Gopinath Hospital, Bhiwadi.</p>
      <a href="/world-heart-day-free-ecg-camp">Explore the free camp <span>→</span></a>
    </div>
  </section>;
}
