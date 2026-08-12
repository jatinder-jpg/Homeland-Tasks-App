import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/queries/people";
import { getOrgProjectsAction } from "@/lib/actions/projects";
import { PeopleView } from "@/components/people/people-view";

export default async function PeoplePage() {
  const supabase = await createClient();

  const [members, orgProjects] = await Promise.all([
    getOrgMembers(supabase),
    getOrgProjectsAction(),
  ]);

  return <PeopleView members={members} orgProjects={orgProjects} />;
}
