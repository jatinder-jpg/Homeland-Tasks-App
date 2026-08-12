"use client";

import { ChevronDown, LogOut, User } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { getInitials, colorForString } from "@/lib/utils/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  fullName,
  orgCode,
}: {
  fullName: string;
  orgCode: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 text-left hover:bg-accent">
        <span
          className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white ${colorForString(fullName)}`}
        >
          {getInitials(fullName)}
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-medium">{fullName}</span>
          <span className="text-xs text-muted-foreground">{orgCode}</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a href="/settings" className="flex items-center gap-2">
            <User className="size-4" />
            Profile settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void signOutAction();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
