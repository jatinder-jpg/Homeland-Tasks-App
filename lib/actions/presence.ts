"use server";

import { createClient } from "@/lib/supabase/server";

export type PresenceEntry = { profileId: string; lastSeenAt: string };

export async function pingPresenceAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return;

  await supabase
    .from("tp_user_presence")
    .upsert(
      { profile_id: user.id, organization_id: profile.organization_id, last_seen_at: new Date().toISOString() },
      { onConflict: "profile_id" },
    );
}

export async function getPresenceMapAction(): Promise<PresenceEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tp_user_presence").select("profile_id, last_seen_at");
  return (data ?? []).map((r) => ({ profileId: r.profile_id, lastSeenAt: r.last_seen_at }));
}
