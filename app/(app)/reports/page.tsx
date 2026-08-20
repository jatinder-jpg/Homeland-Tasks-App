import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/queries/people";
import { getStatusWiseReport, getProjectWiseReport, getOrgActivityFeed } from "@/lib/queries/reports";
import { getPresenceMapAction } from "@/lib/actions/presence";
import { ReportsView } from "@/components/reports/reports-view";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [members, statusWise, projectWise, activityFeed, presence] = await Promise.all([
    getOrgMembers(supabase),
    getStatusWiseReport(supabase),
    getProjectWiseReport(supabase),
    getOrgActivityFeed(supabase, { limit: 100 }),
    getPresenceMapAction(),
  ]);

  return (
    <ReportsView
      members={members}
      statusWise={statusWise}
      projectWise={projectWise}
      activityFeed={activityFeed}
      presence={presence}
    />
  );
}
