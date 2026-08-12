"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import type { FileRow } from "@/lib/queries/documents";

function revalidateDocumentViews() {
  revalidatePath("/documents");
}

export async function getTaskFilesAction(taskId: string): Promise<FileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tp_files")
    .select("*, owner:tp_profiles!tp_files_owner_id_fkey(id, full_name)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as FileRow[];
}

export async function getFolderFilesAction(folderId: string): Promise<FileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tp_files")
    .select("*, owner:tp_profiles!tp_files_owner_id_fkey(id, full_name)")
    .eq("folder_id", folderId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as FileRow[];
}

export async function getFolderSharesAction(folderId: string): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tp_folder_shares")
    .select("shared_with:tp_profiles!tp_folder_shares_shared_with_id_fkey(id, full_name)")
    .eq("folder_id", folderId);
  if (error) return [];
  return (data ?? []).map((row) => row.shared_with).filter(Boolean) as unknown as { id: string; full_name: string }[];
}

export async function getFileSharesAction(fileId: string): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tp_file_shares")
    .select("shared_with:tp_profiles!tp_file_shares_shared_with_id_fkey(id, full_name)")
    .eq("file_id", fileId);
  if (error) return [];
  return (data ?? []).map((row) => row.shared_with).filter(Boolean) as unknown as { id: string; full_name: string }[];
}

export async function createFolderAction(name: string) {
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
    .from("tp_folders")
    .insert({
      organization_id: profile.organization_id,
      owner_id: user.id,
      name,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidateDocumentViews();
  return { success: true as const, id: data.id };
}

export type RecordFileInput = {
  name: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number;
  folderId?: string | null;
  taskId?: string | null;
  source?: "task" | "comment";
};

export async function recordFileAction(input: RecordFileInput) {
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
    .from("tp_files")
    .insert({
      organization_id: profile.organization_id,
      owner_id: user.id,
      folder_id: input.folderId || null,
      task_id: input.taskId || null,
      source: input.source ?? "task",
      name: input.name,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidateDocumentViews();
  if (input.taskId) revalidatePath("/task");
  return { success: true as const, id: data.id };
}

export async function deleteFileAction(fileId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_files").delete().eq("id", fileId);
  if (error) return { error: error.message };

  revalidateDocumentViews();
  return { success: true };
}

export async function deleteFolderAction(folderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_folders").delete().eq("id", folderId);
  if (error) return { error: error.message };

  revalidateDocumentViews();
  return { success: true };
}

export async function renameFileAction(fileId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_files").update({ name }).eq("id", fileId);
  if (error) return { error: error.message };

  revalidateDocumentViews();
  return { success: true };
}

export async function renameFolderAction(folderId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_folders").update({ name }).eq("id", folderId);
  if (error) return { error: error.message };

  revalidateDocumentViews();
  return { success: true };
}

export async function toggleFileStarAction(fileId: string, starred: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = starred
    ? await supabase.from("tp_file_stars").insert({ profile_id: user.id, file_id: fileId })
    : await supabase.from("tp_file_stars").delete().eq("profile_id", user.id).eq("file_id", fileId);

  if (error) return { error: error.message };

  revalidateDocumentViews();
  return { success: true };
}

export async function toggleFolderStarAction(folderId: string, starred: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = starred
    ? await supabase.from("tp_folder_stars").insert({ profile_id: user.id, folder_id: folderId })
    : await supabase.from("tp_folder_stars").delete().eq("profile_id", user.id).eq("folder_id", folderId);

  if (error) return { error: error.message };

  revalidateDocumentViews();
  return { success: true };
}

export async function shareFolderAction(folderId: string, employeeIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: folder } = await supabase
    .from("tp_folders")
    .select("organization_id, name")
    .eq("id", folderId)
    .single();
  if (!folder) return { error: "Folder not found" };

  const { data: existing } = await supabase
    .from("tp_folder_shares")
    .select("shared_with_id")
    .eq("folder_id", folderId);
  const existingIds = new Set((existing ?? []).map((row) => row.shared_with_id));
  const nextIds = new Set(employeeIds);

  const toAdd = employeeIds.filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("tp_folder_shares")
      .insert(toAdd.map((id) => ({ folder_id: folderId, shared_with_id: id, shared_by_id: user.id })));
    if (error) return { error: error.message };
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("tp_folder_shares")
      .delete()
      .eq("folder_id", folderId)
      .in("shared_with_id", toRemove);
    if (error) return { error: error.message };
  }

  if (toAdd.length > 0) {
    const { data: actorProfile } = await supabase
      .from("tp_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await Promise.all(
      toAdd.map((recipientId) =>
        createNotification({
          organizationId: folder.organization_id,
          recipientId,
          actorId: user.id,
          type: "folder_shared",
          title: `${actorProfile?.full_name ?? "Someone"} shared a folder with you`,
          body: folder.name,
          link: "/documents",
        }),
      ),
    );
  }

  revalidateDocumentViews();
  return { success: true };
}

export async function shareFileAction(fileId: string, employeeIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: file } = await supabase
    .from("tp_files")
    .select("organization_id, name")
    .eq("id", fileId)
    .single();
  if (!file) return { error: "File not found" };

  const { data: existing } = await supabase
    .from("tp_file_shares")
    .select("shared_with_id")
    .eq("file_id", fileId);
  const existingIds = new Set((existing ?? []).map((row) => row.shared_with_id));
  const nextIds = new Set(employeeIds);

  const toAdd = employeeIds.filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("tp_file_shares")
      .insert(toAdd.map((id) => ({ file_id: fileId, shared_with_id: id, shared_by_id: user.id })));
    if (error) return { error: error.message };
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("tp_file_shares")
      .delete()
      .eq("file_id", fileId)
      .in("shared_with_id", toRemove);
    if (error) return { error: error.message };
  }

  if (toAdd.length > 0) {
    const { data: actorProfile } = await supabase
      .from("tp_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await Promise.all(
      toAdd.map((recipientId) =>
        createNotification({
          organizationId: file.organization_id,
          recipientId,
          actorId: user.id,
          type: "file_shared",
          title: `${actorProfile?.full_name ?? "Someone"} shared a file with you`,
          body: file.name,
          link: "/documents",
        }),
      ),
    );
  }

  revalidateDocumentViews();
  return { success: true };
}
