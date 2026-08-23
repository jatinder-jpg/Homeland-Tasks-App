import { Video, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";

const INTEGRATIONS = [
  {
    name: "Zoom",
    description: "Schedule and start Zoom meetings directly from a task or project, with a join link shared automatically.",
    icon: Video,
  },
  {
    name: "Google Meet & Calendar",
    description: "Create a Google Meet link and calendar event in one step, with task assignees added as attendees.",
    icon: CalendarDays,
  },
];

export function MeetingsComingSoon() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Meeting</h1>
        <p className="text-sm text-muted-foreground">
          Schedule and join meetings without leaving Homeland Tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map(({ name, description, icon: Icon }) => (
          <Card key={name} className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Coming soon
              </span>
            </div>
            <div>
              <p className="font-heading text-base font-semibold">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        This integration is being set up and will be available soon.
      </p>
    </div>
  );
}
