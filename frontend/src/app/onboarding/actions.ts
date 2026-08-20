"use server";

import { createClient } from "@/lib/supabase/server";

export interface SaveOnboardingResult {
  error?: string;
}

export async function saveOnboarding(
  state: string,
  interests: string[]
): Promise<SaveOnboardingResult> {
  if (!state) return { error: "Select your state" };
  if (interests.length === 0) return { error: "Select at least one category" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Session expired. Please login again." };

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, state, interests }, { onConflict: "id" });

  if (error) return { error: error.message };

  return {};
}
