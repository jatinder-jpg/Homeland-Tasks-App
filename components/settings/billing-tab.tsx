import { Sparkles, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatBytes, STORAGE_QUOTA_BYTES } from "@/lib/utils/format-bytes";

export function BillingTab({ storageUsageBytes }: { storageUsageBytes: number }) {
  const usagePct = Math.min(100, (storageUsageBytes / STORAGE_QUOTA_BYTES) * 100);

  return (
    <div className="max-w-lg space-y-4">
      <Card className="flex items-center gap-4 p-6">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="text-lg font-bold">Free</p>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <HardDrive className="size-4" />
          Storage
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${usagePct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          {formatBytes(storageUsageBytes)} of {formatBytes(STORAGE_QUOTA_BYTES)} used
        </p>
      </Card>
    </div>
  );
}
