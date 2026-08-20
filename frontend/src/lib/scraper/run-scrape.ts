import { createAdminClient } from "@/lib/supabase/admin";
import type { ScrapedEventStatus } from "@/lib/supabase/types";
import { fetchListing } from "./fetch-listing";
import { fetchDetail } from "./fetch-detail";
import { parseDate } from "./parse-date";
import { mapEventType } from "./map-event-type";
import { mapCategory } from "./map-category";

export interface ScrapeSummary {
  found: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const CONCURRENCY = 20;
const BATCH_DELAY_MS = 150;

async function processLink(
  supabase: ReturnType<typeof createAdminClient>,
  link: { title: string; href: string },
  summary: ScrapeSummary
) {
  try {
    const detail = await fetchDetail(link.href);

    if (detail.rows.length === 0) {
      summary.skipped += 1;
      return;
    }

    const inferredCategory = mapCategory(link.title);

    const { data: existingRows } = await supabase
      .from("scraped_events")
      .select("raw_label, raw_value, status")
      .eq("source_url", link.href);

    const existingByLabel = new Map((existingRows ?? []).map((row) => [row.raw_label, row]));

    for (const row of detail.rows) {
      const existing = existingByLabel.get(row.rawLabel);
      const changedSinceApproval = existing?.status === "approved" && existing.raw_value !== row.rawValue;
      const status: ScrapedEventStatus = changedSinceApproval ? "pending" : (existing?.status ?? "pending");

      const { error } = await supabase.from("scraped_events").upsert(
        {
          source_url: link.href,
          raw_label: row.rawLabel,
          raw_value: row.rawValue,
          title: link.title,
          inferred_organization: detail.organization,
          inferred_category: inferredCategory,
          event_type: mapEventType(row.rawLabel),
          parsed_date: parseDate(row.rawValue),
          status,
          reviewed_at: changedSinceApproval ? null : undefined,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: "source_url,raw_label" }
      );

      if (error) {
        summary.errors += 1;
      } else if (existing) {
        summary.updated += 1;
      } else {
        summary.inserted += 1;
      }
    }
  } catch {
    summary.errors += 1;
  }
}

/**
 * Fetches the sarkariresult.com "Latest Jobs" listing, visits each
 * notification page (in small concurrent batches — this can easily be 100+
 * pages, and a single unresponsive one must not stall the whole run), and
 * upserts "Important Dates" rows into scraped_events for admin review. Never
 * writes directly to exams/exam_events.
 */
export async function runScrape(): Promise<ScrapeSummary> {
  const supabase = createAdminClient();
  const summary: ScrapeSummary = { found: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };

  const links = await fetchListing();
  summary.found = links.length;
  console.log(`[scrape] found ${links.length} links`);

  const batches = chunk(links, CONCURRENCY);
  for (const [i, batch] of batches.entries()) {
    await Promise.all(batch.map((link) => processLink(supabase, link, summary)));
    console.log(`[scrape] batch ${i + 1}/${batches.length} done`, summary);
    await sleep(BATCH_DELAY_MS);
  }

  return summary;
}
