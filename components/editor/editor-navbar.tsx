"use client";

import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  // Shown in the center, e.g. the open project's name.
  title?: string;
  // Rendered before the user menu.
  actions?: ReactNode;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  title,
  actions,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  const label = isSidebarOpen ? "Close sidebar" : "Open sidebar";

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 border-b border-surface-border bg-surface px-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-expanded={isSidebarOpen}
          onClick={onToggleSidebar}
          className="text-copy-muted hover:text-copy-primary"
        >
          <SidebarIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex min-w-0 items-center justify-center">
        {title && (
          <h1 className="truncate text-sm font-medium text-copy-primary">
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        {actions}
        <UserButton />
      </div>
    </header>
  );
}
