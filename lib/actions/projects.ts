"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";

function revalidateProjectViews(projectId?: string) {
  revalidatePath("/project");
  if (projectId) revalidatePath(`/project/${projectId}`);
}

export type ProjectInput = {
  name: string;
  description?: string;
  status: "open" | "in_progress" | "on_hold" | "done";
  dueDate?: string | null;
  assigneeId?: string | null;
  geofenceLat?: number | null;
  geofenceLng?: number | null;
  geofenceRadiusM?: number | null;
};

export async function createProjectAction(input: ProjectInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No profile found" };

  const { data, error } = await supabase
    .from("tp_projects")
    .insert({
      organization_id: profile.organization_id,
      name: input.name,
      description: input.description || null,
      status: input.status,
      due_date: input.dueDate || null,
      assignee_id: input.assigneeId || null,
      geofence_lat: input.geofenceLat ?? null,
      geofence_lng: input.geofenceLng ?? null,
      geofence_radius_m: input.geofenceRadiusM ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (input.assigneeId && input.assigneeId !== user.id) {
    const { data: actorProfile } = await supabase
      .from("tp_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await createNotification({
      organizationId: profile.organization_id,
      recipientId: input.assigneeId,
      actorId: user.id,
      type: "project_assigned",
      title: `${actorProfile?.full_name ?? "Someone"} assigned you a project`,
      body: input.name,
      link: `/project/${data.id}`,
    });
  }

  revalidateProjectViews();
  return { success: true as const, id: data.id };
}

export async function updateProjectAction(projectId: string, input: Partial<ProjectInput>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existingProject } = await supabase
    .from("tp_projects")
    .select("assignee_id, name, organization_id")
    .eq("id", projectId)
    .single();

  const { error } = await supabase
    .from("tp_projects")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.dueDate !== undefined && { due_date: input.dueDate || null }),
      ...(input.assigneeId !== undefined && { assignee_id: input.assigneeId || null }),
      ...(input.geofenceLat !== undefined && { geofence_lat: input.geofenceLat }),
      ...(input.geofenceLng !== undefined && { geofence_lng: input.geofenceLng }),
      ...(input.geofenceRadiusM !== undefined && { geofence_radius_m: input.geofenceRadiusM }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) return { error: error.message };

  if (
    existingProject &&
    input.assigneeId !== undefined &&
    input.assigneeId &&
    input.assigneeId !== existingProject.assignee_id &&
    input.assigneeId !== user.id
  ) {
    const { data: actorProfile } = await supabase
      .from("tp_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await createNotification({
      organizationId: existingProject.organization_id,
      recipientId: input.assigneeId,
      actorId: user.id,
      type: "project_assigned",
      title: `${actorProfile?.full_name ?? "Someone"} assigned you a project`,
      body: input.name ?? existingProject.name,
      link: `/project/${projectId}`,
    });
  }

  revalidateProjectViews(projectId);
  return { success: true };
}

export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_projects").delete().eq("id", projectId);

  if (error) return { error: error.message };

  revalidateProjectViews();
  return { success: true };
}

export async function toggleProjectStarAction(projectId: string, starred: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = starred
    ? await supabase.from("tp_project_stars").insert({ profile_id: user.id, project_id: projectId })
    : await supabase
        .from("tp_project_stars")
        .delete()
        .eq("profile_id", user.id)
        .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidateProjectViews(projectId);
  return { success: true };
}

export async function getOrgProjectsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tp_projects")
    .select("id, name")
    .order("name", { ascending: true });

  return data ?? [];
}
