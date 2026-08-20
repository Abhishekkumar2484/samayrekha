import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id }, { onConflict: "id", ignoreDuplicates: true });

      const { data: profile } = await supabase
        .from("profiles")
        .select("state, interests")
        .eq("id", data.user.id)
        .maybeSingle();

      const isOnboarded = Boolean(profile?.state) && Boolean(profile?.interests?.length);
      return NextResponse.redirect(`${origin}${isOnboarded ? "/discover" : "/onboarding"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
