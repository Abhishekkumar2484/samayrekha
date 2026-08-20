"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_LABELS, formatEventDate, getDeadlineStatus } from "@/lib/deadline-status";
import type { DiscoverExam } from "./get-exams";
import { addUserExam } from "./actions";

export function ExamCard({ exam, added }: { exam: DiscoverExam; added: boolean }) {
  const [isAdded, setIsAdded] = useState(added);
  const [isPending, startTransition] = useTransition();

  const statusInfo = exam.nextEvent ? getDeadlineStatus(exam.nextEvent.eventDate) : null;

  function handleAdd() {
    startTransition(async () => {
      const result = await addUserExam(exam.id);
      if (result.error) {
        toast.error("Couldn't add exam", { description: result.error });
        return;
      }
      setIsAdded(true);
      toast.success(`${exam.name} added to your tracker`);
    });
  }

  return (
    <Card className="gap-3 shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {exam.organization}
            </p>
            <h3 className="mt-0.5 text-base font-semibold leading-snug text-foreground">
              {exam.name}
            </h3>
          </div>
          <Badge variant="outline" className="shrink-0 text-[11px] font-medium">
            {exam.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {exam.nextEvent && statusInfo ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                statusInfo.badgeClassName
              )}
            >
              {statusInfo.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {EVENT_TYPE_LABELS[exam.nextEvent.eventType] ?? exam.nextEvent.eventType} ·{" "}
              {formatEventDate(exam.nextEvent.eventDate)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No date available</p>
        )}

        <div className="mt-1 flex items-center gap-2">
          <Button
            size="sm"
            variant={isAdded ? "secondary" : "default"}
            className="flex-1"
            disabled={isAdded || isPending}
            onClick={handleAdd}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isAdded ? (
              <>
                <Check className="size-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Add
              </>
            )}
          </Button>
          {exam.officialUrl && (
            <Button size="sm" variant="ghost" asChild>
              <a href={exam.officialUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
