"use client";

import { useMemo, useState } from "react";
import { NotebookText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/notes/note-card";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import type { NoteRow } from "@/lib/queries/notes";

type Scope = "created" | "shared";

export function NotesView({
  createdNotes,
  sharedNotes,
  starredNoteIds,
  currentUserId,
}: {
  createdNotes: NoteRow[];
  sharedNotes: NoteRow[];
  starredNoteIds: string[];
  currentUserId: string;
}) {
  const [scope, setScope] = useState<Scope>("created");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteRow | null>(null);

  const starredSet = useMemo(() => new Set(starredNoteIds), [starredNoteIds]);

  const notes = scope === "created" ? createdNotes : sharedNotes;
  const q = search.trim().toLowerCase();
  const filtered = q ? notes.filter((n) => n.title.toLowerCase().includes(q)) : notes;

  function openCreate() {
    setEditingNote(null);
    setEditorOpen(true);
  }

  function openEdit(note: NoteRow) {
    if (note.owner_id !== currentUserId) return;
    setEditingNote(note);
    setEditorOpen(true);
  }

  return (
    <div className="flex h-full min-w-0 flex-col p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-heading text-lg font-bold">Notes</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type here to Search"
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add Note
          </Button>
        </div>
      </div>

      <div className="mb-4 flex w-fit rounded-md bg-muted p-0.5">
        <button
          onClick={() => setScope("created")}
          className={`rounded-[6px] px-3 py-1.5 text-sm font-medium ${scope === "created" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
        >
          Created
        </button>
        <button
          onClick={() => setScope("shared")}
          className={`rounded-[6px] px-3 py-1.5 text-sm font-medium ${scope === "shared" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
        >
          Shared
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <NotebookText className="size-10" />
          <p className="font-medium">{scope === "created" ? "Add your first notes" : "No notes shared with you yet"}</p>
          <p className="text-sm">Relax write something beautiful</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              starred={starredSet.has(note.id)}
              editable={note.owner_id === currentUserId}
              onClick={() => openEdit(note)}
            />
          ))}
        </div>
      )}

      <NoteEditorDialog open={editorOpen} onOpenChange={setEditorOpen} note={editingNote} />
    </div>
  );
}
