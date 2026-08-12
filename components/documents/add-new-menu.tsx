"use client";

import { useRef, useState } from "react";
import { Plus, FolderPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { recordFileAction } from "@/lib/actions/documents";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function AddNewMenu({
  onNewFolder,
  folderId,
  showNewFolder = true,
}: {
  onNewFolder: () => void;
  folderId?: string | null;
  showNewFolder?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is larger than the 50MB limit");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      setIsUploading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("tp_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!profile) {
      toast.error("No profile found");
      setIsUploading(false);
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${profile.organization_id}/${user.id}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from("tp-documents").upload(storagePath, file);
    if (uploadError) {
      toast.error(uploadError.message);
      setIsUploading(false);
      return;
    }

    const result = await recordFileAction({
      name: file.name,
      storagePath,
      mimeType: file.type || null,
      sizeBytes: file.size,
      folderId: folderId ?? null,
    });

    setIsUploading(false);

    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("File uploaded");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger disabled={isUploading} className={buttonVariants({ className: "disabled:pointer-events-none disabled:opacity-50" })}>
          <Plus className="size-4" />
          {isUploading ? "Uploading…" : "Add New"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showNewFolder && (
            <DropdownMenuItem onClick={onNewFolder}>
              <FolderPlus className="size-4" />
              Add New Folder
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            Add File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
    </>
  );
}
