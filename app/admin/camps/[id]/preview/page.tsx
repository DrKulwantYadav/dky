import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import type { AdminCampConfig } from "@/lib/camps/contracts";
import { campDate, campTime } from "@/lib/camps/format";
import "../../camps-admin.css";

export default async function PreviewCampPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_camp", { p_id: id });
  if (error) return <div className="admin-alert error">Preview requires the reusable camps migration.</div>;
  if (!data) notFound();
  const camp = data as AdminCampConfig;
  return <section className="admin-panel camp-preview"><p className="admin-eyebrow">Admin preview · {camp.lifecycle}</p><h1>{camp.title}</h1><p>{camp.description}</p><p><strong>Venue:</strong> {camp.venueName}, {camp.venueAddress}</p><h2>Instructions</h2><ul>{camp.instructions.map((item, index) => <li key={index}>{item}</li>)}</ul><h2>Sessions and arrival windows</h2>{camp.sessions.map(session => <article key={session.id || session.date}><h3>{campDate(session.date)} · {campTime(session.startTime)} – {campTime(session.endTime)}</h3><p>{session.active ? "Active" : "Inactive"}</p><div className="camp-preview-slots">{session.slots.map(slot => <span key={slot.id || slot.startTime}>{campTime(slot.startTime)}–{campTime(slot.endTime)} · {slot.capacity} places · {slot.bookedCount || 0} booked</span>)}</div></article>)}<Link className="admin-secondary-button" href={`/admin/camps/${id}`}>Edit camp</Link></section>;
}
