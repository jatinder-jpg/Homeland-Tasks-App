import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export type AttendanceRecord = Database["public"]["Tables"]["tp_attendance_records"]["Row"] & {
  profile: { id: string; full_name: string } | null;
  project: { id: string; name: string } | null;
};

export async function getAttendanceRecords(
  supabase: SupabaseClient<Database>,
  opts: { scope: "mine" | "all"; userId: string; limit?: number },
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from("tp_attendance_records")
    .select("*, profile:tp_profiles(id, full_name), project:tp_projects(id, name)")
    .order("check_in_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.scope === "mine") {
    query = query.eq("profile_id", opts.userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AttendanceRecord[];
}

export async function getOpenAttendanceRecord(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from("tp_attendance_records")
    .select("*, profile:tp_profiles(id, full_name), project:tp_projects(id, name)")
    .eq("profile_id", userId)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .maybeSingle();

  if (error) throw error;
  return data as unknown as AttendanceRecord | null;
}

export type GeofencedProject = { id: string; name: string };

export async function getOrgProjectsForCheckIn(
  supabase: SupabaseClient<Database>,
): Promise<GeofencedProject[]> {
  const { data, error } = await supabase
    .from("tp_projects")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
