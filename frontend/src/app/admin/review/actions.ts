"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionResult {
  error?: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("Not authorized");
  }
}

export interface ApproveOverrides {
  examName: string;
  organization: string;
  category: string;
  eventType: string;
  eventDate: string;
  officialUrl: string;
}

export async function approveScrapedEvent(id: string, overrides: ApproveOverrides): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();

  const { examName, organization, category, eventType, eventDate, officialUrl } = overrides;
  if (!examName || !organization || !category || !eventType || !eventDate) {
    return { error: "All fields are required to approve." };
  }

  const { data: existingExam } = await admin
    .from("exams")
    .select("id")
    .eq("name", examName)
    .eq("organization", organization)
    .maybeSingle();

  let examId = existingExam?.id;

  if (!examId) {
    const { data: newExam, error: examError } = await admin
      .from("exams")
      .insert({ name: examName, organization, category, official_url: officialUrl || null })
      .select("id")
      .single();

    if (examError || !newExam) {
      return { error: examError?.message ?? "Failed to create exam." };
    }
    examId = newExam.id;
  }

  const { data: existingEvent } = await admin
    .from("exam_events")
    .select("id")
    .eq("exam_id", examId)
    .eq("event_type", eventType)
    .maybeSingle();

  let eventId = existingEvent?.id;

  if (eventId) {
    const { error: updateError } = await admin
      .from("exam_events")
      .update({
        event_date: eventDate,
        status: "upcoming",
        official_source_url: officialUrl || null,
        last_verified_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (updateError) return { error: updateError.message };
  } else {
    const { data: newEvent, error: insertError } = await admin
      .from("exam_events")
      .insert({
        exam_id: examId,
        event_type: eventType,
        event_date: eventDate,
        status: "upcoming",
        official_source_url: officialUrl || null,
        last_verified_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !newEvent) {
      return { error: insertError?.message ?? "Failed to create event." };
    }
    eventId = newEvent.id;
  }

  const { error: staginError } = await admin
    .from("scraped_events")
    .update({
      status: "approved",
      promoted_exam_id: examId,
      promoted_event_id: eventId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (staginError) return { error: staginError.message };

  revalidatePath("/admin/review");
  revalidatePath("/discover");
  return {};
}

export async function rejectScrapedEvent(id: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("scraped_events")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/review");
  return {};
}
