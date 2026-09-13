// Order matters: RULES.find returns the first match, so narrower/high-confidence
// patterns (specific central bodies, defence forces, PSU names, ...) are listed
// ahead of broader ones. In particular "UPSC" must precede "State PSC" — "upsc"
// would otherwise satisfy the generic *psc suffix rule and get mis-bucketed as a
// state commission when it's actually the central one.
const RULES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\bupsc\b|union public service commission/i, category: "UPSC" },
  {
    pattern: /\barmy\b|\bnavy\b|air\s*force|agniveer|\bncc\b|\bcapf\b|\bbsf\b|\bcisf\b|\bitbp\b|\bcrpf\b|coast\s*guard/i,
    category: "Defence",
  },
  { pattern: /\baiims\b|\bjipmer\b|\besic\b|\bnursing\b|\banm\b|\bgnm\b|\bnorcet\b|medical officer|health department/i, category: "Medical" },
  { pattern: /high court|district court|\bclat\b|\baibe\b|bar council|judicial service/i, category: "Judiciary" },
  { pattern: /india post|\bgds\b|postal circle/i, category: "Postal" },
  { pattern: /\blic\b|\bnicl\b|\buiic\b|new india assurance|united india insurance|\bpfrda\b|\birdai\b/i, category: "Insurance" },
  {
    // Central Public Sector Undertakings.
    pattern:
      /\bisro\b|\bdrdo\b|\bntpc\b|\bioc(l)?\b|\bongc\b|coal india|\bsail\b|\bnalco\b|\bbsnl\b|\bbhel\b|\bgail\b|\bhal\b|\bpgcil\b|\bnmdc\b|\bconcor\b|\baai\b|\bsjvn\b|\bwcl\b|\brcfl\b|hindustan copper/i,
    category: "PSU",
  },
  {
    pattern: /\btet\b|\btgt\b|\bpgt\b|\bprt\b|assistant professor|\bprofessor\b|\blecturer\b|\bteacher\b|\beducator\b|\bprincipal\b|non[\s-]?teaching|navodaya|\bemrs\b|kasturba gandhi|\bkgbv\b/i,
    category: "Education",
  },
  { pattern: /admission|\bcuet\b|\bncet\b|entrance exam|\bjam\b|\bclat\b|scholarship/i, category: "Admission" },
  { pattern: /\bssc\b|staff selection commission/i, category: "SSC" },
  { pattern: /\bibps\b|\bsbi\b|\brbi\b|\bnabard\b|bank(ing)?\b/i, category: "Banking" },
  { pattern: /\brrb\b|\brrc\b|railway/i, category: "Railway" },
  { pattern: /\bpolice\b|\bconstable\b|\bsi\b\s*recruit/i, category: "Police" },
  {
    // State Public Service Commissions: UPPSC, BPSC, MPPSC, RPSC, WBPSC, etc.
    // {1,6} (not {2,5}) so 4-letter bodies like RPSC/BPSC — one prefix letter
    // plus the "psc" suffix — still satisfy the minimum, alongside longer ones.
    pattern: /\b[a-z]{1,6}psc\b|public service commission/i,
    category: "State PSC",
  },
  {
    // Catch-all for state subordinate service selection boards/corporations
    // that aren't PSCs — UPSSSC, MPESB, RSSB, HSSC, JSSC, BSSC, UPSRTC, etc.
    // Matched by suffix rather than \b-anchored acronym since these are all
    // one token (e.g. "UPSSSC" has no word boundary before "SSC").
    pattern: /\b[a-z]{0,6}(ssc|ssb|esb|rtc)\b|selection board|subordinate service selection|transport corporation|roadways/i,
    category: "State Govt",
  },
];

/** Infers one of INTEREST_CATEGORIES from a listing/exam title. Null if nothing matches. */
export function mapCategory(title: string): string | null {
  const match = RULES.find((rule) => rule.pattern.test(title));
  return match?.category ?? null;
}
