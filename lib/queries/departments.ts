import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export async function getOrgDepartments(
  supabase: SupabaseClient<Database>,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from("tp_departments").select("id, name").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
