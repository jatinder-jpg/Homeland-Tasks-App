import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/queries/people";
import { getStatusWiseReport, getProjectWiseReport } from "@/lib/queries/reports";
import { ReportsView } from "@/components/reports/reports-view";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [members, statusWise, projectWise] = await Promise.all([
    getOrgMembers(supabase),
    getStatusWiseReport(supabase),
    getProjectWiseReport(supabase),
  ]);

  return <ReportsView members={members} statusWise={statusWise} projectWise={projectWise} />;
}
