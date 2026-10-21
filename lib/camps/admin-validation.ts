import type { AdminCampBreak, AdminCampConfig, AdminCampSlot } from "./contracts";

export function minutes(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
export function hhmm(value: number) { return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }

export function generateCampSlots(startTime: string, endTime: string, duration: number, capacity: number, breaks: AdminCampBreak[]): AdminCampSlot[] {
  const start = minutes(startTime), end = minutes(endTime);
  if (!Number.isInteger(duration) || duration < 5 || duration > 240 || !Number.isInteger(capacity) || capacity < 1 || capacity > 10000 ||
      !Number.isFinite(start) || !Number.isFinite(end) || end <= start || end > 1440) throw new Error("Check the session hours, slot duration and capacity.");
  const ranges = breaks.map(item => [minutes(item.startTime), minutes(item.endTime)]);
  if (ranges.some(([from, to]) => !Number.isFinite(from) || !Number.isFinite(to) || from < start || to > end || to <= from)) throw new Error("Breaks must be inside session hours.");
  ranges.sort((a, b) => a[0] - b[0]);
  if (ranges.some((range, index) => index > 0 && range[0] < ranges[index - 1][1])) throw new Error("Breaks cannot overlap.");
  const slots: AdminCampSlot[] = [];
  for (let cursor = start; cursor + duration <= end; cursor += duration) {
    const next = cursor + duration;
    if (ranges.some(([from, to]) => cursor < to && next > from)) continue;
    slots.push({ startTime: hhmm(cursor), endTime: hhmm(next), capacity, active: true });
  }
  if (!slots.length) throw new Error("This session has no bookable windows.");
  return slots;
}

export function validateCampConfig(camp: AdminCampConfig) {
  const errors: string[] = [];
  if (camp.title.trim().length < 3 || camp.title.length > 160) errors.push("Enter a camp title (3–160 characters).");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(camp.slug) || camp.slug.length > 100) errors.push("Use a unique lowercase URL slug with hyphens.");
  if (camp.description.trim().length < 10 || camp.description.length > 2000) errors.push("Enter a short description (10–2000 characters).");
  if (!camp.venueName.trim() || !camp.venueAddress.trim()) errors.push("Enter the venue and address.");
  if (camp.tokenPrefix && !/^[A-Z]{3}$/.test(camp.tokenPrefix)) errors.push("Use exactly three letters for the queue token place code.");
  if (camp.sessions.length < 1) errors.push("Add at least one session.");
  if (camp.registrationOpensAt && camp.registrationClosesAt && Date.parse(camp.registrationClosesAt) <= Date.parse(camp.registrationOpensAt)) errors.push("Registration closing time must be after opening time.");
  const dates = new Set<string>();
  for (const [index, session] of camp.sessions.entries()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(session.date)) errors.push(`Session ${index + 1}: choose a date.`);
    if (dates.has(session.date)) errors.push(`Session ${index + 1}: session dates must be unique.`);
    dates.add(session.date);
    try { generateCampSlots(session.startTime, session.endTime, session.slotDurationMinutes, session.capacityPerSlot, session.breaks); } catch (cause) { errors.push(`Session ${index + 1}: ${cause instanceof Error ? cause.message : "invalid settings"}`); }
    const ranges = session.slots.map(slot => ({ from: minutes(slot.startTime), to: minutes(slot.endTime), capacity: slot.capacity, booked: slot.bookedCount ?? 0 }));
    if (ranges.some(item => !Number.isFinite(item.from) || !Number.isFinite(item.to) || item.from < minutes(session.startTime) || item.to > minutes(session.endTime) || item.to <= item.from || !Number.isInteger(item.capacity) || item.capacity < 1 || item.capacity < item.booked)) errors.push(`Session ${index + 1}: check slot times and capacities.`);
    if (ranges.some(item => session.breaks.some(part => item.from < minutes(part.endTime) && item.to > minutes(part.startTime)))) errors.push(`Session ${index + 1}: a slot overlaps a break.`);
    ranges.sort((a, b) => a.from - b.from);
    if (ranges.some((range, i) => i > 0 && range.from < ranges[i - 1].to)) errors.push(`Session ${index + 1}: slots overlap.`);
  }
  if (camp.lifecycle === "published") {
    if (!camp.tokenPrefix) errors.push("Enter a three-letter queue token place code before publishing.");
    if (!camp.datesReviewed) errors.push("Review the dates before publishing.");
    if (!camp.registrationOpensAt || !camp.registrationClosesAt) errors.push("Set registration opening and closing times before publishing.");
    if (!camp.sessions.some(session => session.active && session.slots.some(slot => slot.active))) errors.push("Publishing requires an active bookable slot.");
  }
  return errors;
}
