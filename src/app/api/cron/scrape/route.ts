import { NextResponse } from "next/server";
import { runScrape } from "@/lib/scraper/run-scrape";

export const maxDuration = 120;

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const summary = await runScrape();
  return NextResponse.json(summary);
}
