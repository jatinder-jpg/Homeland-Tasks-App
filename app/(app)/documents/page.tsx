import { createClient } from "@/lib/supabase/server";
import {
  getFolders,
  getFiles,
  getRecentFiles,
  getStarredDocuments,
  getStarredFolderIds,
  getStarredFileIds,
  getStorageUsage,
} from "@/lib/queries/documents";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { DocumentsView } from "@/components/documents/documents-view";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    mineFolders,
    mineFiles,
    sharedFolders,
    sharedFiles,
    recentFiles,
    starred,
    starredFolderIds,
    starredFileIds,
    storageUsageBytes,
    members,
  ] = await Promise.all([
    getFolders(supabase, { scope: "mine", userId: user.id }),
    getFiles(supabase, { scope: "mine", userId: user.id }),
    getFolders(supabase, { scope: "shared", userId: user.id }),
    getFiles(supabase, { scope: "shared", userId: user.id }),
    getRecentFiles(supabase, { limit: 20 }),
    getStarredDocuments(supabase, user.id),
    getStarredFolderIds(supabase, user.id),
    getStarredFileIds(supabase, user.id),
    getStorageUsage(supabase, user.id),
    getOrgMembersAction(),
  ]);

  return (
    <DocumentsView
      mineFolders={mineFolders}
      mineFiles={mineFiles}
      sharedFolders={sharedFolders}
      sharedFiles={sharedFiles}
      recentFiles={recentFiles}
      starredFolders={starred.folders}
      starredFiles={starred.files}
      starredFolderIds={starredFolderIds}
      starredFileIds={starredFileIds}
      storageUsageBytes={storageUsageBytes}
      currentUserId={user.id}
      members={members}
    />
  );
}
