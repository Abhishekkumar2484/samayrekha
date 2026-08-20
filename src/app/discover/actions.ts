"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AddExamResult {
  error?: string;
}

export async function addUserExam(examId: string): Promise<AddExamResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Session expired. Please login again." };

  const { error } = await supabase.from("user_exams").insert({
    user_id: user.id,
    exam_id: examId,
    application_status: "not_applied",
    reminders_enabled: true,
  });

  if (error && error.code !== "23505") {
    return { error: error.message };
  }

  revalidatePath("/discover");
  return {};
}

export async function saveSubscription(subscription: PushSubscriptionJSON): Promise<AddExamResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Session expired. Please login again." };

  const { error } = await supabase
    .from("profiles")
    .update({ push_subscription: subscription })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
