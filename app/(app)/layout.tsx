import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/app-shell";
import { getUnreadNotificationCount, getRecentNotifications } from "@/lib/queries/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("full_name, organization_id, tp_organizations(name, code)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-lg font-semibold">Setting up your workspace…</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          If this doesn&apos;t resolve after a refresh, please confirm your email first.
        </p>
      </div>
    );
  }

  const org = profile.tp_organizations as unknown as { name: string; code: string };

  const [unreadCount, notifications] = await Promise.all([
    getUnreadNotificationCount(supabase, user.id),
    getRecentNotifications(supabase, { userId: user.id, limit: 10 }),
  ]);

  return (
    <AppShell
      fullName={profile.full_name}
      orgName={org.name}
      orgCode={org.code}
      userId={user.id}
      initialUnreadCount={unreadCount}
      initialNotifications={notifications}
    >
      {children}
    </AppShell>
  );
}
