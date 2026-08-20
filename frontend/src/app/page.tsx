import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("state, interests")
    .eq("id", user.id)
    .maybeSingle();

  const isOnboarded = Boolean(profile?.state) && Boolean(profile?.interests?.length);
  redirect(isOnboarded ? "/discover" : "/onboarding");
}
