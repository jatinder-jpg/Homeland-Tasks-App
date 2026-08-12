"use client";

import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteNoteAction, toggleNoteStarAction } from "@/lib/actions/notes";
import { NOTE_COLORS } from "@/lib/utils/note-colors";
import { formatShortDate } from "@/lib/utils/format-date";
import type { NoteRow } from "@/lib/queries/notes";

export function NoteCard({
  note,
  starred,
  editable,
  onClick,
}: {
  note: NoteRow;
  starred: boolean;
  editable: boolean;
  onClick: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggleStar(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleNoteStarAction(note.id, !starred);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNoteAction(note.id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Note deleted");
    });
  }

  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: NOTE_COLORS[note.color] ?? NOTE_COLORS.yellow }}
      className={`flex h-48 cursor-pointer flex-col rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${isPending ? "opacity-60" : ""}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 flex-1 text-sm font-semibold">{note.title || "Untitled"}</h3>
        <button onClick={toggleStar} aria-label={starred ? "Unstar" : "Star"}>
          <Star className={`size-4 ${starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
        </button>
      </div>
      <div
        className="line-clamp-5 flex-1 text-xs text-foreground/80 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4"
        dangerouslySetInnerHTML={{ __html: note.body_html }}
      />
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{note.owner?.full_name}</span>
        <div className="flex items-center gap-2">
          <span>{formatShortDate(new Date(note.updated_at))}</span>
          {editable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              aria-label="Delete note"
            >
              <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
