export type DeadlineStatus = "urgent" | "this-week" | "upcoming" | "past";

export interface DeadlineStatusInfo {
  status: DeadlineStatus;
  label: string;
  badgeClassName: string;
}

/** Midnight-normalized day difference between an ISO date string and today. */
export function dayDiff(isoDate: string): number {
  const target = new Date(isoDate);
  const today = new Date();
  const t = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const n = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((t - n) / 86400000);
}

export function getDeadlineStatus(isoDate: string): DeadlineStatusInfo {
  const diff = dayDiff(isoDate);

  if (diff < 0) {
    return {
      status: "past",
      label: "Past",
      badgeClassName: "bg-muted text-muted-foreground",
    };
  }
  if (diff === 0) {
    return {
      status: "urgent",
      label: "Today",
      badgeClassName: "bg-status-urgent text-status-urgent-foreground",
    };
  }
  if (diff <= 7) {
    return {
      status: "this-week",
      label: "This Week",
      badgeClassName: "bg-status-week text-status-week-foreground",
    };
  }
  return {
    status: "upcoming",
    label: "Upcoming",
    badgeClassName: "bg-status-upcoming text-status-upcoming-foreground",
  };
}

export function formatEventDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  notification: "Notification",
  application_start: "Application Opens",
  application_end: "Application Closes",
  admit_card: "Admit Card",
  exam_date: "Exam Date",
  answer_key: "Answer Key",
  result: "Result",
  correction: "Correction Window",
};
