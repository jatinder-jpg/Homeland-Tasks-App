import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  Briefcase,
  MessageSquare,
  FolderOpen,
  NotebookText,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  available: boolean;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, available: true },
  { href: "/task", label: "Task", icon: ListChecks, available: true },
  { href: "/project", label: "Project", icon: Briefcase, available: true },
  { href: "/discussion", label: "Discussion", icon: MessageSquare, available: true },
  { href: "/documents", label: "Documents", icon: FolderOpen, available: true },
  { href: "/notes", label: "Notes", icon: NotebookText, available: true },
  { href: "/reports", label: "Reports", icon: BarChart3, available: true },
  { href: "/people", label: "Users", icon: Users, available: true },
  { href: "/settings", label: "Settings", icon: Settings, available: true },
];
