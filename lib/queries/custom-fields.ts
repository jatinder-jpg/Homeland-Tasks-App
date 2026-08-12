import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type CustomFieldDef = {
  id: string;
  name: string;
  field_type: string;
  options: string[];
};

export async function getOrgCustomFields(supabase: SupabaseClient<Database>): Promise<CustomFieldDef[]> {
  const { data, error } = await supabase
    .from("tp_custom_fields")
    .select("id, name, field_type, options")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CustomFieldDef[];
}
