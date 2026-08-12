"use client";

import { useEffect, useState, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  RemoveFormatting,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNoteAction, updateNoteAction } from "@/lib/actions/notes";
import { NOTE_COLORS } from "@/lib/utils/note-colors";
import type { NoteRow } from "@/lib/queries/notes";

const TEXT_COLORS = ["#1f2937", "#dc2626", "#2563eb", "#16a34a", "#d97706"];

export function NoteEditorDialog({
  open,
  onOpenChange,
  note,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteRow | null;
}) {
  const [isPending, startTransition] = useTransition();

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color, Highlight.configure({ multicolor: true })],
    content: "",
    immediatelyRender: false,
  });

  const [title, setTitle] = useState(note?.title ?? "");
  const [color, setColor] = useState(note?.color ?? "yellow");

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setColor(note?.color ?? "yellow");
    editor?.commands.setContent(note?.body_html ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, note?.id]);

  function handleSubmit() {
    if (!editor) return;
    const bodyHtml = editor.getHTML();

    startTransition(async () => {
      const result = note
        ? await updateNoteAction(note.id, { title, bodyHtml, color })
        : await createNoteAction({ title, bodyHtml, color });

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(note ? "Note updated" : "Note created");
      onOpenChange(false);
    });
  }

  if (!editor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" style={{ backgroundColor: NOTE_COLORS[color] }}>
        <DialogHeader>
          <DialogTitle className="sr-only">{note ? "Edit note" : "New note"}</DialogTitle>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add Title"
            className="border-none bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          />
        </DialogHeader>

        <div className="rounded-md border bg-background/60">
          <div className="flex flex-wrap items-center gap-0.5 border-b p-1.5">
            <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough className="size-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="size-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                const url = window.prompt("Link URL");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
            >
              <LinkIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
              <RemoveFormatting className="size-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-border" />
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => editor.chain().focus().setColor(c).run()}
                className="size-5 rounded-full border"
                style={{ backgroundColor: c }}
                aria-label={`Text color ${c}`}
              />
            ))}
          </div>
          <EditorContent editor={editor} className="min-h-48 max-h-96 overflow-y-auto p-3 text-sm [&_.ProseMirror]:outline-none" />
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <Palette className="size-4 text-muted-foreground" />
          {Object.entries(NOTE_COLORS).map(([key, hex]) => (
            <button
              key={key}
              type="button"
              onClick={() => setColor(key)}
              className={`size-6 rounded-full border-2 ${color === key ? "border-foreground" : "border-transparent"}`}
              style={{ backgroundColor: hex }}
              aria-label={`Note color ${key}`}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex size-7 items-center justify-center rounded-md hover:bg-accent ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}
