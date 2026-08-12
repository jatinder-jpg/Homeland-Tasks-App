import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type ProjectWithRelations = Database["public"]["Tables"]["tp_projects"]["Row"] & {
  assignee: { id: string; full_name: string } | null;
  creator: { id: string; full_name: string } | null;
  tasks: { count: number }[];
};

export async function getProjects(
  supabase: SupabaseClient<Database>,
  opts: { filter: "created" | "assigned"; userId: string; search?: string; status?: string },
): Promise<ProjectWithRelations[]> {
  let query = supabase
    .from("tp_projects")
    .select(
      "*, assignee:tp_profiles!tp_projects_assignee_id_fkey(id, full_name), creator:tp_profiles!tp_projects_created_by_fkey(id, full_name), tasks:tp_tasks(count)",
    )
    .order("created_at", { ascending: false });

  query = opts.filter === "created" ? query.eq("created_by", opts.userId) : query.eq("assignee_id", opts.userId);

  if (opts.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  if (opts.status) {
    query = query.eq("status", opts.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ProjectWithRelations[];
}

export async function getProjectDetail(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<ProjectWithRelations | null> {
  const { data, error } = await supabase
    .from("tp_projects")
    .select(
      "*, assignee:tp_profiles!tp_projects_assignee_id_fkey(id, full_name), creator:tp_profiles!tp_projects_created_by_fkey(id, full_name), tasks:tp_tasks(count)",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as ProjectWithRelations | null;
}

export async function getStarredProjectIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("tp_project_stars")
    .select("project_id")
    .eq("profile_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.project_id);
}
