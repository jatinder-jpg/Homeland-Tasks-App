import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/queries/tasks";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { getOrgProjectsAction } from "@/lib/actions/projects";
import { TaskCalendarView } from "@/components/task/task-calendar-view";

export default async function TaskCalendarPage() {
  const supabase = await createClient();

  const [tasks, members, projects] = await Promise.all([
    getTasks(supabase, { includeDrafts: false }),
    getOrgMembersAction(),
    getOrgProjectsAction(),
  ]);

  return <TaskCalendarView tasks={tasks} members={members} projects={projects} />;
}
