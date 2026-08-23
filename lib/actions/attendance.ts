"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { distanceMeters } from "@/lib/utils/geo";
import { getOpenAttendanceRecord } from "@/lib/queries/attendance";

export async function checkInAction(input: { projectId: string | null; lat: number; lng: number }) {
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

  const open = await getOpenAttendanceRecord(supabase, user.id);
  if (open) return { error: "You're already checked in — check out first" };

  if (input.projectId) {
    const { data: project } = await supabase
      .from("tp_projects")
      .select("name, geofence_lat, geofence_lng, geofence_radius_m")
      .eq("id", input.projectId)
      .single();

    if (project && project.geofence_lat !== null && project.geofence_lng !== null && project.geofence_radius_m) {
      const distance = distanceMeters(input.lat, input.lng, project.geofence_lat, project.geofence_lng);
      if (distance > project.geofence_radius_m) {
        return {
          error: `You're ${Math.round(distance)}m from ${project.name} — check-in requires being within ${project.geofence_radius_m}m`,
        };
      }
    }
  }

  const { error } = await supabase.from("tp_attendance_records").insert({
    organization_id: profile.organization_id,
    profile_id: user.id,
    project_id: input.projectId,
    check_in_lat: input.lat,
    check_in_lng: input.lng,
  });
  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { success: true };
}

export async function checkOutAction(recordId: string, input: { lat: number; lng: number }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tp_attendance_records")
    .update({
      check_out_at: new Date().toISOString(),
      check_out_lat: input.lat,
      check_out_lng: input.lng,
    })
    .eq("id", recordId)
    .eq("profile_id", user.id)
    .is("check_out_at", null);

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { success: true };
}
