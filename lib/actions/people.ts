"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPriorityBreakdown, type PriorityBreakdown } from "@/lib/queries/people";

export async function getPriorityBreakdownAction(memberId: string): Promise<PriorityBreakdown[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return getPriorityBreakdown(supabase, { assigneeId: memberId });
}

export async function updateMemberRoleAction(memberId: string, role: "admin" | "member") {
  const supabase = await createClient();
  const { error } = await supabase.from("tp_profiles").update({ role }).eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/people");
  return { success: true };
}
