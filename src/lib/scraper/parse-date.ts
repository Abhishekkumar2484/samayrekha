const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function toIsoDate(year: number, monthIndex: number, day: number): string | null {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Best-effort parse of the free-text date values used on sarkariresult.com.
 * Handles "DD/MM/YYYY", "DD-MM-YYYY", and "D[-D] Month YYYY" (ranges take the
 * first date). Returns null for placeholders like "As per schedule" rather
 * than throwing — those rows stay in the review queue until a real date
 * appears on a later scrape.
 */
export function parseDate(raw: string): string | null {
  const text = raw.trim();

  const numeric = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (numeric) {
    const [, d, m, y] = numeric;
    return toIsoDate(Number(y), Number(m) - 1, Number(d));
  }

  const withMonthName = text.match(/(\d{1,2})(?:\s*(?:-|to)\s*\d{1,2}(?:\s+[A-Za-z]+)?)?\s+([A-Za-z]+)\s+(\d{4})/);
  if (withMonthName) {
    const [, d, monthName, y] = withMonthName;
    const monthIndex = MONTHS[monthName.toLowerCase()];
    if (monthIndex !== undefined) {
      return toIsoDate(Number(y), monthIndex, Number(d));
    }
  }

  return null;
}
