/**
 * Format a date string to YYYY.MM.DD format.
 * Handles common input formats: YYYYMMDD, YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
 * Returns original string if parsing fails.
 */
export function formatDateDot(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value.trim();
  if (!cleaned) return "";

  // Already in YYYY.MM.DD format
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(cleaned)) return cleaned;

  // YYYYMMDD
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}.${cleaned.slice(4, 6)}.${cleaned.slice(6, 8)}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const match = cleaned.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}`;
  }

  return cleaned;
}
