import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/queries/tasks";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { getOrgProjectsAction } from "@/lib/actions/projects";
import { TaskKanbanView } from "@/components/task/task-kanban-view";

export default async function TaskKanbanPage() {
  const supabase = await createClient();

  const [tasks, members, projects] = await Promise.all([
    getTasks(supabase, { includeDrafts: false }),
    getOrgMembersAction(),
    getOrgProjectsAction(),
  ]);

  return <TaskKanbanView tasks={tasks} members={members} projects={projects} />;
}
