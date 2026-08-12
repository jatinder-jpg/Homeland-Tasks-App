"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CustomFieldDef } from "@/lib/queries/custom-fields";

export async function getOrgCustomFieldsAction(): Promise<CustomFieldDef[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tp_custom_fields")
    .select("id, name, field_type, options")
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as CustomFieldDef[];
}

export async function createCustomFieldAction(input: {
  name: string;
  fieldType: "text" | "select";
  options: string[];
}) {
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

  const { error } = await supabase.from("tp_custom_fields").insert({
    organization_id: profile.organization_id,
    name: input.name,
    field_type: input.fieldType,
    options: input.fieldType === "select" ? input.options : [],
  });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCustomFieldAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_custom_fields").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/task");
  return { success: true };
}
