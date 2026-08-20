import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewList, type ReviewGroup } from "./review-list";

export const metadata: Metadata = {
  title: "Review Scraped Exams",
};

async function isAdmin(email: string | null | undefined) {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export default async function AdminReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await isAdmin(user.email))) redirect("/discover");

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("scraped_events")
    .select("*")
    .eq("status", "pending")
    .order("scraped_at", { ascending: false });

  const groups = new Map<string, ReviewGroup>();
  for (const row of rows ?? []) {
    const existing = groups.get(row.source_url);
    if (existing) {
      existing.rows.push(row);
    } else {
      groups.set(row.source_url, {
        sourceUrl: row.source_url,
        title: row.title,
        organization: row.inferred_organization,
        category: row.inferred_category,
        rows: [row],
      });
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Review scraped exams</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {groups.size} exam{groups.size === 1 ? "" : "s"} pending review · sourced from sarkariresult.com
        </p>
      </div>
      <ReviewList groups={Array.from(groups.values())} />
    </main>
  );
}
