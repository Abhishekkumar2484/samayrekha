import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface DetailRow {
  rawLabel: string;
  rawValue: string;
}

export interface DetailPage {
  organization: string | null;
  rows: DetailRow[];
}

export async function fetchDetail(url: string): Promise<DetailPage> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch detail page ${url}: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const organization = $("h2").first().text().trim() || null;

  const datesHeading = $("h3")
    .filter((_, el) => $(el).text().toLowerCase().includes("important dates"))
    .first();

  const rows: DetailRow[] = [];
  const list = datesHeading.nextAll("ul").first();

  list.find("li").each((_, li) => {
    const text = $(li).text().replace(/\s+/g, " ").trim();
    const separatorIndex = text.indexOf(":");
    if (separatorIndex === -1) return;

    const rawLabel = text.slice(0, separatorIndex).trim();
    const rawValue = text.slice(separatorIndex + 1).trim();
    if (rawLabel && rawValue) {
      rows.push({ rawLabel, rawValue });
    }
  });

  return { organization, rows };
}
