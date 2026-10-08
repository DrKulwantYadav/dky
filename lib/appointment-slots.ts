export const APPOINTMENT_FEE_INR = 499;
export const APPOINTMENT_ORIGINAL_FEE_INR = 899;
export const APPOINTMENT_CAPACITY = 4;

export function timeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})(?::00)?$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
}

export function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function clock(minutes: number) {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

export function slotLabel(startTime: string) {
  const start = timeToMinutes(startTime);
  return Number.isFinite(start) ? `${clock(start)} – ${clock(start + 30)}` : startTime;
}
