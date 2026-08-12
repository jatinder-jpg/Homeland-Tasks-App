import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export async function getOrgServices(
  supabase: SupabaseClient<Database>,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from("tp_services").select("id, name").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
