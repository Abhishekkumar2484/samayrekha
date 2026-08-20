import { createClient } from "@/lib/supabase/server";
import type { EventType, ExamEventStatus } from "@/lib/supabase/types";

export interface NextEvent {
  id: string;
  eventType: EventType;
  eventDate: string;
  status: ExamEventStatus;
}

export interface DiscoverExam {
  id: string;
  name: string;
  organization: string;
  category: string;
  officialUrl: string | null;
  nextEvent: NextEvent | null;
}

export interface DiscoverData {
  profileState: string | null;
  interests: string[];
  exams: DiscoverExam[];
  addedExamIds: string[];
}

export async function getDiscoverData(): Promise<DiscoverData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("state, interests")
    .eq("id", user.id)
    .maybeSingle();

  const interests = profile?.interests ?? [];

  if (interests.length === 0) {
    return { profileState: profile?.state ?? null, interests: [], exams: [], addedExamIds: [] };
  }

  const [{ data: exams }, { data: userExams }] = await Promise.all([
    supabase
      .from("exams")
      .select("id, name, organization, category, official_url, exam_events(id, event_type, event_date, status)")
      .in("category", interests),
    supabase.from("user_exams").select("exam_id").eq("user_id", user.id),
  ]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const discoverExams: DiscoverExam[] = (exams ?? []).map((exam) => {
    const events = (exam.exam_events ?? []) as Array<{
      id: string;
      event_type: EventType;
      event_date: string;
      status: ExamEventStatus;
    }>;

    const upcoming = events
      .filter((e) => e.status !== "cancelled" && e.event_date >= todayIso)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))[0];

    const fallback = events.sort((a, b) => b.event_date.localeCompare(a.event_date))[0];
    const chosen = upcoming ?? fallback ?? null;

    return {
      id: exam.id,
      name: exam.name,
      organization: exam.organization,
      category: exam.category,
      officialUrl: exam.official_url,
      nextEvent: chosen
        ? {
            id: chosen.id,
            eventType: chosen.event_type,
            eventDate: chosen.event_date,
            status: chosen.status,
          }
        : null,
    };
  });

  discoverExams.sort((a, b) => {
    if (!a.nextEvent && !b.nextEvent) return a.name.localeCompare(b.name);
    if (!a.nextEvent) return 1;
    if (!b.nextEvent) return -1;
    return a.nextEvent.eventDate.localeCompare(b.nextEvent.eventDate);
  });

  return {
    profileState: profile?.state ?? null,
    interests,
    exams: discoverExams,
    addedExamIds: (userExams ?? []).map((u) => u.exam_id),
  };
}
