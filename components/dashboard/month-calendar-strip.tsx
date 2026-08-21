"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMonthlyDueCountsAction } from "@/lib/actions/dashboard";

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthCalendarStrip({
  initialYear,
  initialMonth,
  initialCounts,
}: {
  initialYear: number;
  initialMonth: number;
  initialCounts: Record<string, number>;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [counts, setCounts] = useState(initialCounts);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (year === initialYear && month === initialMonth) {
      setCounts(initialCounts);
      return;
    }
    startTransition(async () => {
      const data = await getMonthlyDueCountsAction(year, month);
      setCounts(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function shiftMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month - 1, i + 1));
  const todayISO = toISODate(new Date());

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">
          {MONTH_LABELS[month - 1]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="size-7" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <Button size="icon" variant="outline" className="size-7" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className={`flex gap-2 overflow-x-auto pb-1 transition-opacity ${isPending ? "opacity-50" : ""}`}
        onWheel={(e) => (e.currentTarget.scrollLeft += e.deltaY)}
      >
        {days.map((d) => {
          const iso = toISODate(d);
          const isToday = iso === todayISO;
          const count = counts[iso] ?? 0;
          return (
            <Link
              key={iso}
              href={`/task?dueDate=${iso}`}
              className={`flex w-16 shrink-0 flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-colors hover:border-primary/40 ${
                isToday ? "border-primary bg-primary/5" : ""
              }`}
            >
              <span className="text-xs text-muted-foreground">{WEEKDAY_ABBR[d.getDay()]}</span>
              <span className={`font-heading text-lg font-semibold ${isToday ? "text-primary" : ""}`}>
                {d.getDate()}
              </span>
              {count > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
