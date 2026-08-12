import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type NoteRow = Database["public"]["Tables"]["tp_notes"]["Row"] & {
  owner: { id: string; full_name: string } | null;
};

const NOTE_SELECT = "*, owner:tp_profiles!tp_notes_owner_id_fkey(id, full_name)";

export async function getNotes(
  supabase: SupabaseClient<Database>,
  opts: { scope: "created" | "shared"; userId: string },
): Promise<NoteRow[]> {
  let query = supabase.from("tp_notes").select(NOTE_SELECT);
  query = opts.scope === "created" ? query.eq("owner_id", opts.userId) : query.neq("owner_id", opts.userId);

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as NoteRow[];
}

export async function getStarredNoteIds(supabase: SupabaseClient<Database>, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("tp_note_stars").select("note_id").eq("profile_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.note_id);
}
