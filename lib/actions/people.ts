"use server";

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
