import * as cheerio from "cheerio";

const LISTING_URL = "https://www.sarkariresult.com/latestjob/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface ListingLink {
  title: string;
  href: string;
}

export async function fetchListing(): Promise<ListingLink[]> {
  const res = await fetch(LISTING_URL, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch listing page: ${res.status}`);
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
