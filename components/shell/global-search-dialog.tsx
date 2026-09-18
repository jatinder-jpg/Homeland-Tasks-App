"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ListChecks,
  Briefcase,
  MessageSquare,
  FileText,
  NotebookText,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { globalSearchAction, type GlobalSearchResult } from "@/lib/actions/global-search";

const TYPE_ICON: Record<GlobalSearchResult["type"], typeof Search> = {
  task: ListChecks,
  project: Briefcase,
  message: MessageSquare,
  file: FileText,
  note: NotebookText,
};

const TYPE_LABEL: Record<GlobalSearchResult["type"], string> = {
  task: "Task",
  project: "Project",
  message: "Discussion",
  file: "Document",
  note: "Note",
};

export function GlobalSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      globalSearchAction(trimmed).then((data) => {
        setResults(data);
        setIsSearching(false);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(result: GlobalSearchResult) {
    onOpenChange(false);
    router.push(result.link);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, discussion, documents, notes…"
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5">
          {query.trim().length < 2 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search across the whole app.
            </p>
          ) : isSearching ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No results for &quot;{query}&quot;.</p>
          ) : (
            results.map((result) => {
              const Icon = TYPE_ICON[result.type];
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{result.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{TYPE_LABEL[result.type]}</span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
