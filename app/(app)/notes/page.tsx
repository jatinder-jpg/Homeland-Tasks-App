import { createClient } from "@/lib/supabase/server";
import { getNotes, getStarredNoteIds } from "@/lib/queries/notes";
import { NotesView } from "@/components/notes/notes-view";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [createdNotes, sharedNotes, starredNoteIds] = await Promise.all([
    getNotes(supabase, { scope: "created", userId: user.id }),
    getNotes(supabase, { scope: "shared", userId: user.id }),
    getStarredNoteIds(supabase, user.id),
  ]);

  return (
    <NotesView
      createdNotes={createdNotes}
      sharedNotes={sharedNotes}
      starredNoteIds={starredNoteIds}
      currentUserId={user.id}
    />
  );
}
