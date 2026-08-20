import type { EventType } from "@/lib/supabase/types";

const RULES: Array<{ pattern: RegExp; type: EventType }> = [
  { pattern: /application begin|registration start|form start/i, type: "application_start" },
  { pattern: /last date.*(apply|online|registration|submission)/i, type: "application_end" },
  { pattern: /admit card/i, type: "admit_card" },
  { pattern: /exam date/i, type: "exam_date" },
  { pattern: /answer key/i, type: "answer_key" },
  { pattern: /result/i, type: "result" },
  { pattern: /correction/i, type: "correction" },
  { pattern: /notification/i, type: "notification" },
];

/** Maps a raw sarkariresult.com "Important Dates" label to our EventType. Null if no rule matches. */
export function mapEventType(rawLabel: string): EventType | null {
  const match = RULES.find((rule) => rule.pattern.test(rawLabel));
  return match?.type ?? null;
}
