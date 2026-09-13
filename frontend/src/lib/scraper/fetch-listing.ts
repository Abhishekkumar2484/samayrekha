import * as cheerio from "cheerio";

// Every sarkariresult.com section that lists exam notifications in the same
// "sarkari-quick-list" markup. Latest Jobs, Admit Card, Answer Key, Result,
// Admission, and Syllabus each surface a different subset/stage of exams, so
// scraping only one leaves gaps (e.g. a result posted after the job listing
// scrolled off "Latest Jobs"). "important" is included too but is mostly
// external tinyurl links, filtered out below.
const SECTIONS = ["latestjob", "admitcard", "answerkey", "result", "admission", "syllabus", "important"];
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface ListingLink {
  title: string;
  href: string;
}

async function fetchSection(section: string): Promise<ListingLink[]> {
  const res = await fetch(`https://www.sarkariresult.com/${section}/`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${section} listing page: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const links: ListingLink[] = [];
  $("ul.sarkari-quick-list li a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const title = $(el).text().split("|")[0].trim();
    if (href && title) {
      links.push({ title, href });
    }
  });

  return links;
}

/**
 * Fetches every listing section and merges them into a deduped set of exam
 * notification pages, keyed by URL (the same exam commonly appears in
 * multiple sections, e.g. both "admitcard" and "result"). Non-sarkariresult.com
 * links (shortener redirects that occasionally show up in "important") are
 * dropped since fetchDetail can't parse them.
 */
export async function fetchListing(): Promise<ListingLink[]> {
  const results = await Promise.allSettled(SECTIONS.map(fetchSection));

  const byHref = new Map<string, ListingLink>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const link of result.value) {
      if (!/^https:\/\/(www\.)?sarkariresult\.com\//.test(link.href)) continue;
      if (!byHref.has(link.href)) {
        byHref.set(link.href, link);
      }
    }
  }

  return Array.from(byHref.values());
}
