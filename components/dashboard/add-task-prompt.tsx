import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ChecklistIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="30" y="8" width="60" height="80" rx="6" fill="var(--muted)" />
      <rect x="38" y="20" width="44" height="6" rx="3" fill="var(--brand-gold)" />
      <rect x="38" y="34" width="34" height="4" rx="2" fill="var(--border)" />
      <rect x="38" y="44" width="34" height="4" rx="2" fill="var(--border)" />
      <rect x="38" y="54" width="34" height="4" rx="2" fill="var(--border)" />
      <circle cx="42" cy="35.5" r="3" fill="none" stroke="var(--brand-navy)" strokeWidth="1.5" />
      <circle cx="42" cy="45.5" r="3" fill="var(--brand-navy)" />
      <path d="M40.5 45.5l1 1 2-2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="42" cy="55.5" r="3" fill="none" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="95" cy="70" r="18" fill="var(--brand-gold)" opacity="0.15" />
      <path
        d="M84 78l22-30"
        stroke="var(--brand-gold)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M104 46l4 4-4 4-4-4z" fill="var(--brand-navy)" />
    </svg>
  );
}

export function AddTaskPrompt({ hasTasks }: { hasTasks: boolean }) {
  return (
    <Card className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="font-heading text-base font-semibold">
          {hasTasks ? "Add another task" : "You haven't added any tasks"}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasTasks ? "Keep the team moving." : "Welcome — let's get started."}
        </p>
        <Button asChild className="mt-3">
          <Link href="/task">
            <Plus className="size-4" />
            Add Task
          </Link>
        </Button>
      </div>
      <ChecklistIllustration />
    </Card>
  );
}
