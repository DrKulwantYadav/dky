"use client";
import "./community.css";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main className="community-page"><div className="community-empty"><h1>Community activities are temporarily unavailable</h1><p>Please try loading this page again.</p><button type="button" onClick={reset}>Try again</button></div></main>;
}
