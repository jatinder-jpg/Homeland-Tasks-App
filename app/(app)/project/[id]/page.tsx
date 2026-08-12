import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectDetail, getStarredProjectIds } from "@/lib/queries/projects";
import { getTasks } from "@/lib/queries/tasks";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { getOrgProjectsAction } from "@/lib/actions/projects";
import { ProjectDetailView } from "@/components/project/project-detail-view";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const project = await getProjectDetail(supabase, id);
  if (!project) notFound();

  const [tasks, starredIds, members, projects] = await Promise.all([
    getTasks(supabase, { includeDrafts: false, projectId: id }),
    getStarredProjectIds(supabase, user.id),
    getOrgMembersAction(),
    getOrgProjectsAction(),
  ]);

  return (
    <ProjectDetailView
      project={project}
      tasks={tasks}
      starred={starredIds.includes(id)}
      members={members}
      projects={projects}
    />
  );
}
