import { Card } from "@/components/ui/card";
import type { PriorityCounts } from "@/lib/queries/dashboard";

const COLORS = {
  high: { ring: "#e24b4a", dot: "bg-red-500" },
  medium: { ring: "#efa03f", dot: "bg-amber-500" },
  low: { ring: "#63b96a", dot: "bg-emerald-500" },
};

export function PriorityTaskSummary({ counts }: { counts: PriorityCounts }) {
  const { high, medium, low, total } = counts;

  const gradient =
    total === 0
      ? "conic-gradient(var(--muted) 0deg 360deg)"
      : (() => {
          const highDeg = (high / total) * 360;
          const mediumDeg = (medium / total) * 360;
          return `conic-gradient(${COLORS.high.ring} 0deg ${highDeg}deg, ${COLORS.medium.ring} ${highDeg}deg ${highDeg + mediumDeg}deg, ${COLORS.low.ring} ${highDeg + mediumDeg}deg 360deg)`;
        })();

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-heading text-sm font-semibold">Priority Task Summary</h2>
      <div className="flex items-center justify-center">
        <div
          className="relative flex size-32 shrink-0 items-center justify-center rounded-full"
          style={{ background: gradient }}
        >
          <div className="flex size-22 items-center justify-center rounded-full bg-card">
            <span className="font-heading text-2xl font-semibold">{total}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${COLORS.low.dot}`} />
          Low <span className="font-semibold">{low}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${COLORS.medium.dot}`} />
          Medium <span className="font-semibold">{medium}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${COLORS.high.dot}`} />
          High <span className="font-semibold">{high}</span>
        </span>
      </div>
    </Card>
  );
}
