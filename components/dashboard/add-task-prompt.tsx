import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ChecklistIllustration() {
  return (
    <svg width="180" height="128" viewBox="0 0 200 140" fill="none" aria-hidden="true" className="shrink-0">
      {/* backdrop */}
      <circle cx="150" cy="65" r="52" fill="var(--brand-gold)" opacity="0.1" />
      <rect x="6" y="120" width="188" height="2" fill="var(--border)" />

      {/* small shelf + plant, left */}
      <rect x="8" y="104" width="26" height="16" rx="2" fill="var(--muted)" />
      <path d="M14 104c0-8 4-13 7-13s7 5 7 13" fill="none" stroke="var(--brand-gold)" strokeWidth="2" />
      <path d="M12 104c0-6 3-10 5-10" fill="none" stroke="var(--brand-gold)" strokeWidth="2" opacity="0.6" />

      {/* person */}
      <g>
        <circle cx="62" cy="46" r="11" fill="var(--brand-navy)" />
        <path
          d="M45 118v-30c0-13 8-21 17-21s17 8 17 21v30"
          fill="var(--brand-navy)"
        />
        <path d="M60 62l14 10" stroke="var(--brand-navy)" strokeWidth="9" strokeLinecap="round" />
        <path d="M42 118h40v6a3 3 0 0 1-3 3H45a3 3 0 0 1-3-3z" fill="var(--brand-gold)" opacity="0.5" />
      </g>

      {/* giant pencil, diagonal from hand toward phone */}
      <g transform="rotate(-38 74 72)">
        <rect x="74" y="66" width="70" height="12" rx="2" fill="var(--brand-gold)" />
        <path d="M144 66l12 6-12 6z" fill="var(--foreground)" opacity="0.75" />
        <rect x="68" y="66" width="8" height="12" fill="var(--foreground)" opacity="0.75" />
      </g>

      {/* phone / checklist card */}
      <rect x="118" y="18" width="66" height="104" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      <rect x="128" y="30" width="46" height="6" rx="3" fill="var(--brand-navy)" />
      <g>
        <rect x="128" y="48" width="10" height="10" rx="2" fill="none" stroke="var(--brand-gold)" strokeWidth="2" />
        <path d="M130.5 53l1.8 1.8 3.2-3.6" stroke="var(--brand-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="144" y="50" width="26" height="4" rx="2" fill="var(--border)" />

        <rect x="128" y="66" width="10" height="10" rx="2" fill="var(--brand-navy)" />
        <path d="M130.5 71l1.8 1.8 3.2-3.6" stroke="var(--card)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="144" y="68" width="26" height="4" rx="2" fill="var(--border)" />

        <rect x="128" y="84" width="10" height="10" rx="2" fill="none" stroke="var(--border)" strokeWidth="2" />
        <rect x="144" y="86" width="20" height="4" rx="2" fill="var(--border)" />
      </g>
      <rect x="128" y="104" width="34" height="8" rx="4" fill="var(--brand-gold)" />
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
