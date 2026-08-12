"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVisiblePipelines, type PipelineWithStages } from "@/lib/queries/pipelines";

export async function getVisiblePipelinesAction(): Promise<PipelineWithStages[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getVisiblePipelines(supabase);
}

export async function createPipelineAction(input: {
  name: string;
  visibility: "public" | "private";
  stageNames: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (input.stageNames.length === 0) return { error: "Add at least one stage" };

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No profile found" };

  const { data: pipeline, error } = await supabase
    .from("tp_pipelines")
    .insert({
      organization_id: profile.organization_id,
      name: input.name,
      visibility: input.visibility,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const stageRows = input.stageNames.map((name, index) => ({
    pipeline_id: pipeline.id,
    name,
    position: index,
  }));

  const { error: stagesError } = await supabase.from("tp_pipeline_stages").insert(stageRows);
  if (stagesError) return { error: stagesError.message };

  revalidatePath("/task/kanban");
  return { success: true as const, id: pipeline.id };
}

export async function deletePipelineAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_pipelines").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/task/kanban");
  return { success: true };
}
