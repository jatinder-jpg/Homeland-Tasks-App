"use server";

import { createClient } from "@/lib/supabase/server";

export type GlobalSearchResult = {
  id: string;
  type: "task" | "project" | "message" | "file" | "note";
  title: string;
  link: string;
};

export async function globalSearchAction(query: string): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const like = `%${trimmed}%`;

  const [tasks, projects, messages, files, notes] = await Promise.all([
    supabase.from("tp_tasks").select("id, name").ilike("name", like).eq("is_archived", false).limit(5),
    supabase.from("tp_projects").select("id, name").ilike("name", like).limit(5),
    supabase
      .from("tp_discussion_messages")
      .select("id, body, channel_id")
      .ilike("body", like)
      .eq("is_deleted", false)
      .limit(5),
    supabase.from("tp_files").select("id, name").ilike("name", like).limit(5),
    supabase.from("tp_notes").select("id, title").ilike("title", like).limit(5),
  ]);

  const results: GlobalSearchResult[] = [];
  for (const t of tasks.data ?? []) {
    results.push({ id: t.id, type: "task", title: t.name, link: `/task?open=${t.id}` });
  }
  for (const p of projects.data ?? []) {
    results.push({ id: p.id, type: "project", title: p.name, link: `/project/${p.id}` });
  }
  for (const m of messages.data ?? []) {
    results.push({
      id: m.id,
      type: "message",
      title: m.body.slice(0, 80),
      link: `/discussion?channel=${m.channel_id}`,
    });
  }
  for (const f of files.data ?? []) {
    results.push({ id: f.id, type: "file", title: f.name, link: "/documents" });
  }
  for (const n of notes.data ?? []) {
    results.push({ id: n.id, type: "note", title: n.title || "Untitled note", link: "/notes" });
  }

  return results;
}
