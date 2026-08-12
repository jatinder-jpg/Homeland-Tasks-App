import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type PipelineWithStages = Database["public"]["Tables"]["tp_pipelines"]["Row"] & {
  stages: { id: string; name: string; position: number }[];
};

export async function getVisiblePipelines(
  supabase: SupabaseClient<Database>,
): Promise<PipelineWithStages[]> {
  const { data, error } = await supabase
    .from("tp_pipelines")
    .select("*, stages:tp_pipeline_stages(id, name, position)")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as unknown as PipelineWithStages[]).map((p) => ({
    ...p,
    stages: [...p.stages].sort((a, b) => a.position - b.position),
  }));
}
