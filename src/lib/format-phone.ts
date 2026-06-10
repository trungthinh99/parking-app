/**
 * Format a raw phone input into the Korean mobile format `010-1234-5678`.
 * Strips non-digits, caps at 11 digits, and inserts hyphens progressively.
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
