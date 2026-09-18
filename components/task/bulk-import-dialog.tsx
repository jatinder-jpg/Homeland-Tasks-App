"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createTaskAction } from "@/lib/actions/tasks";

type ParsedRow = {
  name: string;
  description?: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  projectName?: string;
};

const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseRows(text: string): ParsedRow[] {
  const raw = parseCsv(text);
  if (raw.length === 0) return [];

  const header = raw[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.findIndex((h) => h === "task name" || h === "name");
  const descIdx = header.findIndex((h) => h === "description");
  const dueIdx = header.findIndex((h) => h === "due date" || h === "duedate");
  const priorityIdx = header.findIndex((h) => h === "priority");
  const projectIdx = header.findIndex((h) => h === "project");

  if (nameIdx === -1) return [];

  return raw
    .slice(1)
    .map((cells) => {
      const name = (cells[nameIdx] ?? "").trim();
      const priorityRaw = (priorityIdx >= 0 ? cells[priorityIdx] ?? "" : "").trim().toLowerCase();
      return {
        name,
        description: descIdx >= 0 ? cells[descIdx]?.trim() || undefined : undefined,
        dueDate: dueIdx >= 0 ? cells[dueIdx]?.trim() || undefined : undefined,
        priority: (VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : "medium") as "low" | "medium" | "high",
        projectName: projectIdx >= 0 ? cells[projectIdx]?.trim() || undefined : undefined,
      };
    })
    .filter((r) => r.name.length > 0);
}

export function BulkImportDialog({
  open,
  onOpenChange,
  projects,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: { id: string; name: string }[];
  onImported: () => void;
}) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRows([]);
    setFileName("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const parsed = parseRows(text);
    if (parsed.length === 0) {
      toast.error("No valid rows found — make sure the CSV has a \"Task Name\" column");
      return;
    }
    setFileName(file.name);
    setRows(parsed);
  }

  function handleImport() {
    startTransition(async () => {
      let created = 0;
      let draftCount = 0;
      let failed = 0;

      for (const row of rows) {
        const matchedProject = row.projectName
          ? projects.find((p) => p.name.toLowerCase() === row.projectName!.toLowerCase())
          : undefined;
        const isDraft = !matchedProject;

        const result = await createTaskAction({
          name: row.name,
          description: row.description,
          priority: row.priority,
          dueDate: row.dueDate || null,
          projectId: matchedProject?.id ?? null,
          isDraft,
        });

        if (result && "error" in result) {
          failed++;
        } else {
          created++;
          if (isDraft) draftCount++;
        }
      }

      const parts = [`${created} task${created === 1 ? "" : "s"} imported`];
      if (draftCount > 0) parts.push(`${draftCount} saved as draft (no matching project)`);
      if (failed > 0) parts.push(`${failed} failed`);
      toast[failed > 0 ? "error" : "success"](parts.join(" — "));

      reset();
      onOpenChange(false);
      onImported();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Tasks</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: <strong>Task Name</strong> (required), Description, Due Date
            (YYYY-MM-DD), Priority (low/medium/high), Project (matched by name — unmatched rows are saved as
            drafts).
          </DialogDescription>
        </DialogHeader>

        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

        {rows.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground hover:border-primary/40 hover:bg-accent/30"
          >
            <Upload className="size-5" />
            Click to choose a CSV file
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {fileName} — {rows.length} row{rows.length === 1 ? "" : "s"} ready to import
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
              {rows.slice(0, 20).map((row, i) => (
                <div key={i} className="truncate text-sm">
                  {row.name}
                  {row.projectName && (
                    <span className="text-xs text-muted-foreground"> — {row.projectName}</span>
                  )}
                </div>
              ))}
              {rows.length > 20 && (
                <p className="text-xs text-muted-foreground">and {rows.length - 20} more…</p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Choose a different file
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleImport} disabled={rows.length === 0 || isPending}>
            {isPending ? "Importing…" : `Import ${rows.length || ""} task${rows.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
