"use server";

import { createClient } from "@/lib/supabase/server";
import { getStatistics, type MonthlyStatRow } from "@/lib/queries/dashboard";

export async function getStatisticsAction(
  scope: "all" | "mine",
  range: "monthly" | "weekly",
): Promise<MonthlyStatRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return getStatistics(supabase, { scope, range, userId: user.id });
}

export async function getMemberStatisticsAction(
  memberId: string,
  range: "monthly" | "weekly",
): Promise<MonthlyStatRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return getStatistics(supabase, { scope: "mine", range, userId: memberId });
}
