const indianMobile = /^(?:\+?91[\s-]*)?[6-9](?:[\s-]*\d){9}$/;

export function normalizeIndianMobile(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 32 || !indianMobile.test(value.trim())) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length === 12 ? digits.slice(2) : digits;
}
