"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getOrgDepartmentsAction(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("tp_departments").select("id, name").order("name", { ascending: true });
  return data ?? [];
}

export async function createDepartmentAction(name: string) {
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

  const { error } = await supabase.from("tp_departments").insert({ organization_id: profile.organization_id, name });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function renameDepartmentAction(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_departments").update({ name }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteDepartmentAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_departments").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/task");
  return { success: true };
}

export async function getDepartmentMembersAction(departmentId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tp_department_members")
    .select("profile_id")
    .eq("department_id", departmentId);
  return (data ?? []).map((r) => r.profile_id);
}

export async function addDepartmentMemberAction(departmentId: string, profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tp_department_members")
    .insert({ department_id: departmentId, profile_id: profileId });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function removeDepartmentMemberAction(departmentId: string, profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tp_department_members")
    .delete()
    .eq("department_id", departmentId)
    .eq("profile_id", profileId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
