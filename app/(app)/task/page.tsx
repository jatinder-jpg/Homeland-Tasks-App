import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/queries/tasks";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { getOrgProjectsAction } from "@/lib/actions/projects";
import { TaskListView } from "@/components/task/task-list-view";

export default async function TaskPage() {
  const supabase = await createClient();

  const [tasks, draftTasks, archivedTasks, recurringTasks, members, projects] = await Promise.all([
    getTasks(supabase, { includeDrafts: false }),
    getTasks(supabase, { includeDrafts: true }),
    getTasks(supabase, { archivedOnly: true }),
    getTasks(supabase, { recurringOnly: true }),
    getOrgMembersAction(),
    getOrgProjectsAction(),
  ]);

  return (
    <TaskListView
      tasks={tasks}
      draftTasks={draftTasks}
      archivedTasks={archivedTasks}
      recurringTasks={recurringTasks}
      members={members}
      projects={projects}
    />
  );
}
