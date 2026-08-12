"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { createClient } from "@/lib/supabase/client";
import { getTaskFilesAction, recordFileAction } from "@/lib/actions/documents";
import { uploadFileToStorage } from "@/lib/utils/upload-to-storage";
import { formatNumericDate } from "@/lib/utils/format-date";
import { formatBytes } from "@/lib/utils/format-bytes";
import type { FileRow } from "@/lib/queries/documents";

function AttachmentRow({ file }: { file: FileRow }) {
  async function open() {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("tp-documents").createSignedUrl(file.storage_path, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent/50"
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
      <div className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <AvatarBadge name={file.owner?.full_name ?? null} />
        <span className="truncate">{file.owner?.full_name}</span>
      </div>
      <span className="hidden w-20 shrink-0 text-xs text-muted-foreground md:inline">
        {formatNumericDate(new Date(file.created_at))}
      </span>
      <span className="hidden w-14 shrink-0 text-xs text-muted-foreground md:inline">
        {formatBytes(file.size_bytes)}
      </span>
    </button>
  );
}

export function TaskAttachmentList({ taskId }: { taskId: string }) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    getTaskFilesAction(taskId).then(setFiles);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    const uploaded = await uploadFileToStorage(file);
    if ("error" in uploaded) {
      toast.error(uploaded.error);
      setIsUploading(false);
      return;
    }

    const result = await recordFileAction({
      name: file.name,
      storagePath: uploaded.storagePath,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
      taskId,
      source: "task",
    });
    setIsUploading(false);

    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("File uploaded");
    refresh();
  }

  const taskFiles = files.filter((f) => f.source === "task");
  const commentFiles = files.filter((f) => f.source === "comment");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <Upload className="size-3.5" />
          {isUploading ? "Uploading…" : "Upload Document"}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="mb-1 px-3 text-xs font-medium text-muted-foreground">
        Task Attachment ({taskFiles.length})
      </div>
      <div className="mb-4 rounded-md border">
        {taskFiles.length === 0 ? (
          <p className="p-3 text-center text-sm text-muted-foreground">No files yet.</p>
        ) : (
          taskFiles.map((f) => <AttachmentRow key={f.id} file={f} />)
        )}
      </div>

      <div className="mb-1 px-3 text-xs font-medium text-muted-foreground">
        Comment Attachment ({commentFiles.length})
      </div>
      <div className="rounded-md border">
        {commentFiles.length === 0 ? (
          <p className="p-3 text-center text-sm text-muted-foreground">No files yet.</p>
        ) : (
          commentFiles.map((f) => <AttachmentRow key={f.id} file={f} />)
        )}
      </div>
    </div>
  );
}
