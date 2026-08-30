export function StatusBadge({ value }: { value: string | null }) {
  const tone = (value || "Unknown").toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-badge status-${tone}`}>{value || "—"}</span>;
}
