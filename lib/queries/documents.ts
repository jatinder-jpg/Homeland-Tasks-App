import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type FolderRow = Database["public"]["Tables"]["tp_folders"]["Row"] & {
  owner: { id: string; full_name: string } | null;
};

export type FileRow = Database["public"]["Tables"]["tp_files"]["Row"] & {
  owner: { id: string; full_name: string } | null;
};

const FOLDER_SELECT = "*, owner:tp_profiles!tp_folders_owner_id_fkey(id, full_name)";
const FILE_SELECT = "*, owner:tp_profiles!tp_files_owner_id_fkey(id, full_name)";

export async function getFolders(
  supabase: SupabaseClient<Database>,
  opts: { scope: "mine" | "shared"; userId: string },
): Promise<FolderRow[]> {
  if (opts.scope === "shared") {
    const { data, error } = await supabase
      .from("tp_folder_shares")
      .select("folder:tp_folders(*, owner:tp_profiles!tp_folders_owner_id_fkey(id, full_name))")
      .eq("shared_with_id", opts.userId);
    if (error) throw error;
    return (data ?? []).map((row) => row.folder).filter(Boolean) as unknown as FolderRow[];
  }

  const { data, error } = await supabase
    .from("tp_folders")
    .select(FOLDER_SELECT)
    .is("parent_id", null)
    .eq("owner_id", opts.userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FolderRow[];
}

export async function getFiles(
  supabase: SupabaseClient<Database>,
  opts: { scope: "mine" | "shared"; userId: string },
): Promise<FileRow[]> {
  if (opts.scope === "shared") {
    const { data, error } = await supabase
      .from("tp_file_shares")
      .select("file:tp_files(*, owner:tp_profiles!tp_files_owner_id_fkey(id, full_name))")
      .eq("shared_with_id", opts.userId);
    if (error) throw error;
    return (data ?? []).map((row) => row.file).filter(Boolean) as unknown as FileRow[];
  }

  const { data, error } = await supabase
    .from("tp_files")
    .select(FILE_SELECT)
    .is("folder_id", null)
    .eq("owner_id", opts.userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FileRow[];
}

export async function getRecentFiles(
  supabase: SupabaseClient<Database>,
  opts: { limit: number },
): Promise<FileRow[]> {
  const { data, error } = await supabase
    .from("tp_files")
    .select(FILE_SELECT)
    .order("created_at", { ascending: false })
    .limit(opts.limit);

  if (error) throw error;
  return (data ?? []) as unknown as FileRow[];
}

export async function getStarredDocuments(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ folders: FolderRow[]; files: FileRow[] }> {
  const [{ data: folderStars, error: folderErr }, { data: fileStars, error: fileErr }] = await Promise.all([
    supabase
      .from("tp_folder_stars")
      .select("folder:tp_folders(*, owner:tp_profiles!tp_folders_owner_id_fkey(id, full_name))")
      .eq("profile_id", userId),
    supabase
      .from("tp_file_stars")
      .select("file:tp_files(*, owner:tp_profiles!tp_files_owner_id_fkey(id, full_name))")
      .eq("profile_id", userId),
  ]);

  if (folderErr) throw folderErr;
  if (fileErr) throw fileErr;

  const folders = (folderStars ?? []).map((row) => row.folder).filter(Boolean) as unknown as FolderRow[];
  const files = (fileStars ?? []).map((row) => row.file).filter(Boolean) as unknown as FileRow[];
  return { folders, files };
}

export async function getStarredFolderIds(supabase: SupabaseClient<Database>, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("tp_folder_stars").select("folder_id").eq("profile_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.folder_id);
}

export async function getStarredFileIds(supabase: SupabaseClient<Database>, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("tp_file_stars").select("file_id").eq("profile_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.file_id);
}

export async function getFolderShares(
  supabase: SupabaseClient<Database>,
  folderId: string,
): Promise<{ id: string; full_name: string }[]> {
  const { data, error } = await supabase
    .from("tp_folder_shares")
    .select("shared_with:tp_profiles!tp_folder_shares_shared_with_id_fkey(id, full_name)")
    .eq("folder_id", folderId);
  if (error) throw error;
  return (data ?? []).map((row) => row.shared_with).filter(Boolean) as unknown as { id: string; full_name: string }[];
}

export async function getFileShares(
  supabase: SupabaseClient<Database>,
  fileId: string,
): Promise<{ id: string; full_name: string }[]> {
  const { data, error } = await supabase
    .from("tp_file_shares")
    .select("shared_with:tp_profiles!tp_file_shares_shared_with_id_fkey(id, full_name)")
    .eq("file_id", fileId);
  if (error) throw error;
  return (data ?? []).map((row) => row.shared_with).filter(Boolean) as unknown as { id: string; full_name: string }[];
}

export async function getStorageUsage(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
  const { data, error } = await supabase.from("tp_files").select("size_bytes").eq("owner_id", userId);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + (row.size_bytes ?? 0), 0);
}
