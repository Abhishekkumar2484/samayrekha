"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { INTEREST_CATEGORIES } from "@/lib/constants";
import { EVENT_TYPE_LABELS } from "@/lib/deadline-status";
import type { Database } from "@/lib/supabase/types";
import { approveScrapedEvent, rejectScrapedEvent } from "./actions";

type ScrapedEventRow = Database["public"]["Tables"]["scraped_events"]["Row"];

export interface ReviewGroup {
  sourceUrl: string;
  title: string;
  organization: string | null;
  category: string | null;
  rows: ScrapedEventRow[];
}

export function ReviewList({ groups }: { groups: ReviewGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing pending review right now.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <ReviewGroupCard key={group.sourceUrl} group={group} />
      ))}
    </div>
  );
}

function ReviewGroupCard({ group }: { group: ReviewGroup }) {
  const [examName, setExamName] = useState(group.title);
  const [organization, setOrganization] = useState(group.organization ?? "");
  const [category, setCategory] = useState(group.category ?? "");
  const [officialUrl, setOfficialUrl] = useState(group.sourceUrl);
  const [handled, setHandled] = useState<Set<string>>(new Set());

  const pendingRows = group.rows.filter((row) => !handled.has(row.id));
  if (pendingRows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="gap-3">
        <a
          href={group.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline"
        >
          {group.sourceUrl}
        </a>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`name-${group.sourceUrl}`}>Exam name</Label>
            <Input id={`name-${group.sourceUrl}`} value={examName} onChange={(e) => setExamName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`org-${group.sourceUrl}`}>Organization</Label>
            <Input
              id={`org-${group.sourceUrl}`}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`cat-${group.sourceUrl}`}>Category</Label>
            <select
              id={`cat-${group.sourceUrl}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Select category</option>
              {INTEREST_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`url-${group.sourceUrl}`}>Official URL</Label>
            <Input id={`url-${group.sourceUrl}`} value={officialUrl} onChange={(e) => setOfficialUrl(e.target.value)} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {pendingRows.map((row) => (
          <ReviewRow
            key={row.id}
            row={row}
            examName={examName}
            organization={organization}
            category={category}
            officialUrl={officialUrl}
            onHandled={() => setHandled((prev) => new Set(prev).add(row.id))}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ReviewRow({
  row,
  examName,
  organization,
  category,
  officialUrl,
  onHandled,
}: {
  row: ScrapedEventRow;
  examName: string;
  organization: string;
  category: string;
  officialUrl: string;
  onHandled: () => void;
}) {
  const [eventType, setEventType] = useState(row.event_type ?? "");
  const [eventDate, setEventDate] = useState(row.parsed_date ?? "");
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    if (!eventType || !eventDate) {
      toast.error("Set an event type and date first");
      return;
    }
    startTransition(async () => {
      const result = await approveScrapedEvent(row.id, {
        examName,
        organization,
        category,
        eventType,
        eventDate,
        officialUrl,
      });
      if (result.error) {
        toast.error("Approve failed", { description: result.error });
        return;
      }
      toast.success(`${row.raw_label} approved`);
      onHandled();
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectScrapedEvent(row.id);
      if (result.error) {
        toast.error("Reject failed", { description: result.error });
        return;
      }
      onHandled();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <p className="text-sm">
        <span className="font-medium text-foreground">{row.raw_label}</span>
        <span className="text-muted-foreground"> — {row.raw_value}</span>
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Event type</option>
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-9" />
        <Button size="sm" disabled={isPending} onClick={handleApprove}>
          Approve
        </Button>
        <Button size="sm" variant="ghost" disabled={isPending} onClick={handleReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}
