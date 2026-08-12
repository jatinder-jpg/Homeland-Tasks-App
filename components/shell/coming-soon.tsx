import { Construction } from "lucide-react";

export function ComingSoon({ module, phase }: { module: string; phase: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Construction className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{module}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {module} is coming in {phase}. This section isn&apos;t built yet.
      </p>
    </div>
  );
}
