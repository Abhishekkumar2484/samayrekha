const RULES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\bssc\b|staff selection commission/i, category: "SSC" },
  { pattern: /\bibps\b|\bsbi\b|\brbi\b|\bnabard\b|bank(ing)?\b/i, category: "Banking" },
  { pattern: /\brrb\b|\brrc\b|railway/i, category: "Railway" },
  { pattern: /\bpolice\b|\bconstable\b|\bsi\b\s*recruit/i, category: "Police" },
  {
    // State Public Service Commissions: UPPSC, BPSC, MPPSC, RPSC, WBPSC, etc.,
    // plus the generic "public service commission" / "PSC" phrasing.
    pattern: /\b[a-z]{2,5}psc\b|public service commission/i,
    category: "State PSC",
  },
];

/** Infers one of INTEREST_CATEGORIES from a listing/exam title. Null if nothing matches. */
export function mapCategory(title: string): string | null {
  const match = RULES.find((rule) => rule.pattern.test(title));
  return match?.category ?? null;
}
