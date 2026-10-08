"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <div className="admin-panel" role="alert"><h1>Could not load Community Activity</h1><p>Check the Supabase connection and try again.</p><button className="admin-secondary-button" type="button" onClick={reset}>Try again</button></div>;
}
