import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ORG_CODE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  let user = data.user;

  if (error || !user) {
    // The recovery/confirmation link can be hit twice in quick succession
    // (email clients and browsers often prefetch links). If a concurrent
    // request already exchanged the code and established a session, honor
    // that instead of bouncing a legitimately-logged-in user to sign-in.
    const {
      data: { user: existingUser },
    } = await supabase.auth.getUser();

    if (!existingUser) {
      return NextResponse.redirect(`${origin}/sign-in?error=confirmation_failed`);
    }

    user = existingUser;
  }

  const { data: existingProfile } = await supabase
    .from("tp_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const fullName = (user.user_metadata?.full_name as string | undefined) ?? "Member";
    const joinOrgCode = (user.user_metadata?.join_org_code as string | undefined) ?? DEFAULT_ORG_CODE;

    await supabase.rpc("tp_join_organization", { org_code: joinOrgCode, member_full_name: fullName });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
