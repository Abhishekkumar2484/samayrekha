import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PushSubscribe } from "@/components/push-subscribe";
import { getDiscoverData } from "./get-exams";
import { ExamCard } from "./exam-card";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Discover Exams",
};

export default async function DiscoverPage() {
  const data = await getDiscoverData();

  if (!data) {
    redirect("/login");
  }

  if (data.interests.length === 0) {
    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 pb-3 pt-5 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Discover Exams</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {data.profileState ? `${data.profileState} · ` : ""}
              {data.interests.join(", ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" asChild aria-label="Edit preferences">
              <Link href="/onboarding">
                <Settings2 className="size-5" />
              </Link>
            </Button>
            <form action={signOut}>
              <Button variant="ghost" size="icon" aria-label="Log out" type="submit">
                <LogOut className="size-5" />
              </Button>
            </form>
          </div>
        </div>
        <div className="mt-3">
          <PushSubscribe />
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {data.exams.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-sm font-medium text-foreground">No exams available yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Exams matching your categories will be added soon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-6">
            {data.exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} added={data.addedExamIds.includes(exam.id)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
