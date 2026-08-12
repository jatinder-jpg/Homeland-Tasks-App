"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateNoteViews() {
  revalidatePath("/notes");
}

export type NoteInput = {
  title: string;
  bodyHtml: string;
  color: string;
};

export async function createNoteAction(input: NoteInput) {
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

  const { data, error } = await supabase
    .from("tp_notes")
    .insert({
      organization_id: profile.organization_id,
      owner_id: user.id,
      title: input.title,
      body_html: input.bodyHtml,
      color: input.color,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidateNoteViews();
  return { success: true as const, id: data.id };
}

export async function updateNoteAction(noteId: string, input: Partial<NoteInput>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tp_notes")
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.bodyHtml !== undefined && { body_html: input.bodyHtml }),
      ...(input.color !== undefined && { color: input.color }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId);

  if (error) return { error: error.message };

  revalidateNoteViews();
  return { success: true };
}

export async function deleteNoteAction(noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_notes").delete().eq("id", noteId);
  if (error) return { error: error.message };

  revalidateNoteViews();
  return { success: true };
}

export async function toggleNoteStarAction(noteId: string, starred: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = starred
    ? await supabase.from("tp_note_stars").insert({ profile_id: user.id, note_id: noteId })
    : await supabase.from("tp_note_stars").delete().eq("profile_id", user.id).eq("note_id", noteId);

  if (error) return { error: error.message };

  revalidateNoteViews();
  return { success: true };
}
