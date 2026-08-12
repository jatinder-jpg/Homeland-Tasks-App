import { createClient } from "@/lib/supabase/client";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export async function uploadFileToStorage(
  file: File,
): Promise<{ storagePath: string; mimeType: string | null; sizeBytes: number } | { error: string }> {
  if (file.size > MAX_FILE_BYTES) return { error: "File is larger than the 50MB limit" };

  const supabase = createClient();
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

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${profile.organization_id}/${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("tp-documents").upload(storagePath, file);
  if (uploadError) return { error: uploadError.message };

  return { storagePath, mimeType: file.type || null, sizeBytes: file.size };
}
