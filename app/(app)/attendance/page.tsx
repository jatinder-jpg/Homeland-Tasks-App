import { createClient } from "@/lib/supabase/server";
import { getAttendanceRecords, getOpenAttendanceRecord, getOrgProjectsForCheckIn } from "@/lib/queries/attendance";
import { AttendanceView } from "@/components/attendance/attendance-view";

export default async function AttendancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [openRecord, myRecords, allRecords, projects] = await Promise.all([
    getOpenAttendanceRecord(supabase, user.id),
    getAttendanceRecords(supabase, { scope: "mine", userId: user.id }),
    getAttendanceRecords(supabase, { scope: "all", userId: user.id }),
    getOrgProjectsForCheckIn(supabase),
  ]);

  return (
    <AttendanceView
      openRecord={openRecord}
      myRecords={myRecords}
      allRecords={allRecords}
      projects={projects}
    />
  );
}
