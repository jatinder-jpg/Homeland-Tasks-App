"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getOrgTeamsAction(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("tp_teams").select("id, name").order("name", { ascending: true });
  return data ?? [];
}

export async function createTeamAction(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No profile found" };

  const { error } = await supabase.from("tp_teams").insert({ organization_id: profile.organization_id, name });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function renameTeamAction(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_teams").update({ name }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteTeamAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_teams").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/task");
  return { success: true };
}
