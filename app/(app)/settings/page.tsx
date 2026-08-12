import { createClient } from "@/lib/supabase/server";
import { getStorageUsage } from "@/lib/queries/documents";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, storageUsageBytes] = await Promise.all([
    supabase
      .from("tp_profiles")
      .select("full_name, phone, role, organization_id, tp_organizations(*)")
      .eq("id", user.id)
      .single(),
    getStorageUsage(supabase, user.id),
  ]);

  if (!profile || !profile.tp_organizations) return null;

  return (
    <SettingsView
      fullName={profile.full_name}
      phone={profile.phone}
      email={user.email ?? ""}
      organization={profile.tp_organizations}
      isAdmin={profile.role === "admin"}
      storageUsageBytes={storageUsageBytes}
    />
  );
}
