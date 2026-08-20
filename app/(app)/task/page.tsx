import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/queries/tasks";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { getOrgProjectsAction } from "@/lib/actions/projects";
import { TaskListView } from "@/components/task/task-list-view";

export default async function TaskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? "";

  const [tasks, draftTasks, archivedTasks, recurringTasks, members, projects] = await Promise.all([
    getTasks(supabase, { includeDrafts: false, currentUserId }),
    getTasks(supabase, { includeDrafts: true, currentUserId }),
    getTasks(supabase, { archivedOnly: true, currentUserId }),
    getTasks(supabase, { recurringOnly: true, currentUserId }),
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
