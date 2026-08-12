"use client";

import { useState, useTransition } from "react";
import { FileText, Star, MoreVertical, Trash2, Download, Share2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { ShareDialog } from "@/components/documents/share-dialog";
import { toggleFileStarAction, deleteFileAction } from "@/lib/actions/documents";
import { formatNumericDate } from "@/lib/utils/format-date";
import { formatBytes } from "@/lib/utils/format-bytes";
import { createClient } from "@/lib/supabase/client";
import type { FileRow as FileRowType } from "@/lib/queries/documents";

export function FileRow({
  file,
  starred,
  currentUserId,
  members,
}: {
  file: FileRowType;
  starred: boolean;
  currentUserId: string;
  members: { id: string; full_name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const isOwner = file.owner_id === currentUserId;

  function toggleStar(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleFileStarAction(file.id, !starred);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  async function openFile() {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("tp-documents")
      .createSignedUrl(file.storage_path, 60);

    if (error || !data) {
      toast.error(error?.message ?? "Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    openFile();
  }

  function handleDelete() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.storage.from("tp-documents").remove([file.storage_path]);

      const result = await deleteFileAction(file.id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("File deleted");
    });
  }

  return (
    <div
      onClick={openFile}
      className={`flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/50 ${isPending ? "opacity-60" : ""}`}
    >
      <FileText className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
      <div className="hidden w-32 shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <AvatarBadge name={file.owner?.full_name ?? null} />
        <span className="truncate">{file.owner?.full_name}</span>
      </div>
      <span className="hidden w-24 shrink-0 text-xs text-muted-foreground md:inline">{formatNumericDate(new Date(file.created_at))}</span>
      <span className="hidden w-16 shrink-0 text-xs text-muted-foreground md:inline">{formatBytes(file.size_bytes)}</span>
      <button onClick={toggleStar} aria-label={starred ? "Unstar" : "Star"}>
        <Star className={`size-4 ${starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      </button>
      <button onClick={handleDownload} aria-label="Download">
        <Download className="size-4 text-muted-foreground" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button onClick={(e) => e.stopPropagation()} aria-label="More options">
            <MoreVertical className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwner && (
            <DropdownMenuItem onSelect={() => setShareOpen(true)}>
              <Share2 className="size-4" />
              Share
            </DropdownMenuItem>
          )}
          {isOwner && (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isOwner && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          itemType="file"
          itemId={file.id}
          itemName={file.name}
          members={members.filter((m) => m.id !== currentUserId)}
        />
      )}
    </div>
  );
}
