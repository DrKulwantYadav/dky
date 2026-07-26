"use client";

import { useCallback, useEffect, useRef } from "react";

const conditionCards = [
  { slug: "diabetes", image: "/carousel-diabetes.png", category: "Metabolic health", title: "Diabetes and high blood sugar", text: "Diagnosis, monitoring and practical long-term glucose management." },
  { slug: "hypertension", image: "/carousel-hypertension.png", category: "Cardiovascular health", title: "High blood pressure", text: "Risk assessment and treatment planning for healthier blood pressure." },
  { slug: "fatty-liver-masld", image: "/carousel-fatty-liver.png", category: "Liver health", title: "Fatty liver and metabolic health", text: "Whole-person care for MASLD and related metabolic risks." },
  { slug: "ckm-syndrome", image: "/carousel-heart-kidney.png", category: "Connected health", title: "Heart–kidney–metabolic health", text: "Assessment of connected cardiovascular, kidney and metabolic risks." },
  { slug: "obesity-weight-management", image: "/carousel-weight.png", category: "Weight management", title: "Obesity and weight-related conditions", text: "Medical assessment of weight, health risks and sustainable options." },
  { slug: "respiratory-infections", image: "/carousel-respiratory.png", category: "Adult medicine", title: "Respiratory and general medical concerns", text: "Assessment of respiratory illness, fever, infections and broader adult medical concerns." },
];

export default function ConditionCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const move = useCallback((direction: number, loop = false) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".condition-slide");
    const distance = card ? card.offsetWidth + 20 : track.clientWidth * 0.85;
    const currentCard = Math.round(track.scrollLeft / distance);
    const visibleCards = Math.max(1, Math.floor((track.clientWidth + 20) / distance));
    const lastCard = Math.max(0, conditionCards.length - visibleCards);
    const nextCard = currentCard + direction;
    const targetCard = loop && nextCard > lastCard ? 0 : Math.min(lastCard, Math.max(0, nextCard));
    track.scrollTo({ left: targetCard * distance, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!pausedRef.current) move(1, true);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [move]);

  return (
    <div
      className="condition-carousel"
      aria-label="Featured health conditions"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocusCapture={() => { pausedRef.current = true; }}
      onBlurCapture={() => { pausedRef.current = false; }}
      onPointerDown={() => { pausedRef.current = true; }}
      onPointerUp={() => { pausedRef.current = false; }}
    >
      <button className="carousel-arrow carousel-arrow-prev" type="button" onClick={() => move(-1)} aria-label="View previous conditions">←</button>
      <div className="condition-carousel-track" ref={trackRef}>
        {conditionCards.map((condition) => (
          <a className="condition-slide" href={`/conditions/${condition.slug}`} key={condition.slug}>
            <div className={`condition-slide-visual visual-tone-${condition.slug}`} aria-hidden="true">
              <span><img src={condition.image} alt="" /></span>
              <i />
            </div>
            <div className="condition-slide-content">
              <span className="condition-chip">{condition.category}</span>
              <h3>{condition.title}</h3>
              <strong>Read patient guide <b>→</b></strong>
            </div>
          </a>
        ))}
      </div>
      <button className="carousel-arrow carousel-arrow-next" type="button" onClick={() => move(1)} aria-label="View more conditions">→</button>
    </div>
  );
}
