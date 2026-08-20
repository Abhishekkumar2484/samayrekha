import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import { dayDiff, EVENT_TYPE_LABELS } from "@/lib/deadline-status";

export const maxDuration = 60;

type ReminderType = "day_of" | "three_day";

interface Candidate {
  userId: string;
  examName: string;
  eventId: string;
  eventType: string;
  reminderType: ReminderType;
}

function reminderTypeFor(diff: number): ReminderType | null {
  if (diff === 0) return "day_of";
  if (diff === 3) return "three_day";
  return null;
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const summary = { checked: 0, sent: 0, skipped: 0, errors: 0 };

  const { data: userExams } = await admin
    .from("user_exams")
    .select("user_id, exams(name, exam_events(id, event_type, event_date, status))")
    .eq("reminders_enabled", true);

  const candidates: Candidate[] = [];
  for (const row of userExams ?? []) {
    const exam = row.exams as unknown as {
      name: string;
      exam_events: Array<{ id: string; event_type: string; event_date: string; status: string }>;
    } | null;
    if (!exam) continue;

    for (const event of exam.exam_events ?? []) {
      if (event.status === "cancelled") continue;
      const reminderType = reminderTypeFor(dayDiff(event.event_date));
      if (!reminderType) continue;
      candidates.push({
        userId: row.user_id,
        examName: exam.name,
        eventId: event.id,
        eventType: event.event_type,
        reminderType,
      });
    }
  }

  summary.checked = candidates.length;
  if (candidates.length === 0) return NextResponse.json(summary);

  const userIds = Array.from(new Set(candidates.map((c) => c.userId)));
  const { data: profiles } = await admin.from("profiles").select("id, push_subscription").in("id", userIds);
  const subscriptionByUser = new Map((profiles ?? []).map((p) => [p.id, p.push_subscription]));

  for (const candidate of candidates) {
    const subscription = subscriptionByUser.get(candidate.userId);
    if (!subscription) {
      summary.skipped += 1;
      continue;
    }

    const { data: alreadySent } = await admin
      .from("reminders_sent")
      .select("id")
      .eq("user_id", candidate.userId)
      .eq("exam_event_id", candidate.eventId)
      .eq("reminder_type", candidate.reminderType)
      .maybeSingle();

    if (alreadySent) {
      summary.skipped += 1;
      continue;
    }

    const label = EVENT_TYPE_LABELS[candidate.eventType] ?? candidate.eventType;
    const sent = await sendPushToUser(candidate.userId, subscription as PushSubscriptionJSON, {
      title: candidate.examName,
      body: candidate.reminderType === "day_of" ? `${label} is today` : `${label} is in 3 days`,
      url: "/discover",
    });

    if (sent) {
      await admin.from("reminders_sent").insert({
        user_id: candidate.userId,
        exam_event_id: candidate.eventId,
        reminder_type: candidate.reminderType,
      });
      summary.sent += 1;
    } else {
      summary.errors += 1;
    }
  }

  return NextResponse.json(summary);
}
