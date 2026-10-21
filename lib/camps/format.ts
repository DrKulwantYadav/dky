const dateFormatter = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric", weekday: "long" });
const shortDateFormatter = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });

export function campDate(value: string, short = false) {
  const date = new Date(`${value}T12:00:00+05:30`);
  return Number.isNaN(date.getTime()) ? value : (short ? shortDateFormatter : dateFormatter).format(date);
}

export function campTime(value: string) {
  const normalized = /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  const time = new Date(`2000-01-01T${normalized}+05:30`);
  return Number.isNaN(time.getTime()) ? value : timeFormatter.format(time);
}

export function campDateRange(first: string, last: string) {
  return first === last ? campDate(first, true) : `${campDate(first, true)} – ${campDate(last, true)}`;
}
