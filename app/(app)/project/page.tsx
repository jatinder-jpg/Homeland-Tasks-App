import { createClient } from "@/lib/supabase/server";
import { getProjects, getStarredProjectIds } from "@/lib/queries/projects";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { ProjectListView } from "@/components/project/project-list-view";

export default async function ProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [createdProjects, assignedProjects, starredIds, members] = await Promise.all([
    getProjects(supabase, { filter: "created", userId: user.id }),
    getProjects(supabase, { filter: "assigned", userId: user.id }),
    getStarredProjectIds(supabase, user.id),
    getOrgMembersAction(),
  ]);

  return (
    <ProjectListView
      createdProjects={createdProjects}
      assignedProjects={assignedProjects}
      starredIds={starredIds}
      members={members}
    />
  );
}
