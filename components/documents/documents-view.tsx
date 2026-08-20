"use client";

import { useMemo, useState, useTransition } from "react";
import { Folder, Clock, Star, HardDrive, ArrowLeft, Search } from "lucide-react";
import { FolderRow } from "@/components/documents/folder-row";
import { FileRow } from "@/components/documents/file-row";
import { NewFolderDialog } from "@/components/documents/new-folder-dialog";
import { AddNewMenu } from "@/components/documents/add-new-menu";
import { getFolderFilesAction } from "@/lib/actions/documents";
import { formatBytes, STORAGE_QUOTA_BYTES } from "@/lib/utils/format-bytes";
import type { FolderRow as FolderRowType, FileRow as FileRowType } from "@/lib/queries/documents";

type Scope = "mine" | "shared" | "recent" | "favourites";

export function DocumentsView({
  mineFolders,
  mineFiles,
  sharedFolders,
  sharedFiles,
  recentFiles,
  starredFolders,
  starredFiles,
  starredFolderIds,
  starredFileIds,
  storageUsageBytes,
  currentUserId,
  members,
}: {
  mineFolders: FolderRowType[];
  mineFiles: FileRowType[];
  sharedFolders: FolderRowType[];
  sharedFiles: FileRowType[];
  recentFiles: FileRowType[];
  starredFolders: FolderRowType[];
  starredFiles: FileRowType[];
  starredFolderIds: string[];
  starredFileIds: string[];
  storageUsageBytes: number;
  currentUserId: string;
  members: { id: string; full_name: string }[];
}) {
  const [scope, setScope] = useState<Scope>("mine");
  const [search, setSearch] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [openFolder, setOpenFolder] = useState<FolderRowType | null>(null);
  const [folderFiles, setFolderFiles] = useState<FileRowType[]>([]);
  const [isPending, startTransition] = useTransition();

  const starredFolderSet = useMemo(() => new Set(starredFolderIds), [starredFolderIds]);
  const starredFileSet = useMemo(() => new Set(starredFileIds), [starredFileIds]);

  const { folders, files } = useMemo(() => {
    switch (scope) {
      case "mine":
        return { folders: mineFolders, files: mineFiles };
      case "shared":
        return { folders: sharedFolders, files: sharedFiles };
      case "recent":
        return { folders: [], files: recentFiles };
      case "favourites":
        return { folders: starredFolders, files: starredFiles };
    }
  }, [scope, mineFolders, mineFiles, sharedFolders, sharedFiles, recentFiles, starredFolders, starredFiles]);

  const q = search.trim().toLowerCase();
  const filteredFolders = q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : folders;
  const filteredFiles = q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;

  function openFolderDetail(folder: FolderRowType) {
    setOpenFolder(folder);
    startTransition(async () => {
      const files = await getFolderFilesAction(folder.id);
      setFolderFiles(files);
    });
  }

  const scopeItems: { key: Scope; label: string; icon: typeof Folder }[] = [
    { key: "mine", label: "My Folders", icon: Folder },
    { key: "shared", label: "Shared with Me", icon: Folder },
    { key: "recent", label: "Recent", icon: Clock },
    { key: "favourites", label: "Favourites", icon: Star },
  ];

  const usagePct = Math.min(100, (storageUsageBytes / STORAGE_QUOTA_BYTES) * 100);

  return (
    <div className="flex h-full min-w-0">
      <div className="flex w-56 shrink-0 flex-col gap-1 border-r p-4">
        <h1 className="mb-2 font-heading text-lg font-bold">Documents</h1>
        {scopeItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setScope(key);
              setOpenFolder(null);
            }}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
              scope === key && !openFolder ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}

        <div className="mt-auto rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 p-4 text-white">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <HardDrive className="size-4" />
            My Storage
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white" style={{ width: `${usagePct}%` }} />
          </div>
          <p className="text-xs">
            {formatBytes(storageUsageBytes)} of {formatBytes(STORAGE_QUOTA_BYTES)}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {!openFolder && <AddNewMenu onNewFolder={() => setNewFolderOpen(true)} />}
          {openFolder && <AddNewMenu onNewFolder={() => {}} folderId={openFolder.id} showNewFolder={false} />}
        </div>

        {openFolder ? (
          <button
            onClick={() => setOpenFolder(null)}
            className="mb-3 flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {scopeItems.find((s) => s.key === scope)?.label} / <span className="font-medium text-foreground">{openFolder.name}</span>
          </button>
        ) : null}

        <div className="overflow-hidden rounded-lg border bg-card">
          {openFolder ? (
            isPending ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
            ) : folderFiles.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">This folder is empty.</div>
            ) : (
              folderFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  starred={starredFileSet.has(file.id)}
                  currentUserId={currentUserId}
                  members={members}
                />
              ))
            )
          ) : (
            <>
              {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  {scope === "favourites"
                    ? "No starred files or folders. Add stars to things you want to find easily later."
                    : scope === "recent"
                      ? "No recent files yet."
                      : "Nothing here yet."}
                </div>
              )}
              {filteredFolders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  starred={starredFolderSet.has(folder.id)}
                  currentUserId={currentUserId}
                  members={members}
                  onOpen={() => openFolderDetail(folder)}
                />
              ))}
              {filteredFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  starred={starredFileSet.has(file.id)}
                  currentUserId={currentUserId}
                  members={members}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <NewFolderDialog open={newFolderOpen} onOpenChange={setNewFolderOpen} />
    </div>
  );
}
