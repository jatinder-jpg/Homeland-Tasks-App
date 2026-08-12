import { createClient } from "@/lib/supabase/server";
import { getChannelsForUser } from "@/lib/queries/discussion";
import { getOrgMembersAction } from "@/lib/actions/tasks";
import { DiscussionView } from "@/components/discussion/discussion-view";

export default async function DiscussionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [channels, archivedChannels, members] = await Promise.all([
    getChannelsForUser(supabase, { userId: user.id }),
    getChannelsForUser(supabase, { userId: user.id, archivedOnly: true }),
    getOrgMembersAction(),
  ]);

  return (
    <DiscussionView
      initialChannels={channels}
      archivedChannels={archivedChannels}
      members={members}
      currentUserId={user.id}
    />
  );
}
