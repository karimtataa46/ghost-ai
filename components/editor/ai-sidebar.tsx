"use client";

import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Placeholder for the AI chat. Mirrors `ProjectSidebar`: a floating panel that slides
// in from the right over the canvas without resizing it.
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      aria-label="AI assistant"
      aria-hidden={!isOpen}
      className={cn(
        "absolute top-3 right-3 bottom-3 z-30 flex w-80 max-w-[calc(100%-1.5rem)] flex-col rounded-2xl border border-surface-border bg-surface/90 backdrop-blur-xl",
        "transition-[transform,visibility] duration-200 ease-out",
        isOpen ? "visible translate-x-0" : "invisible translate-x-[calc(100%+0.75rem)]"
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border pr-2 pl-4">
        <h2 className="flex items-center gap-2 text-sm font-medium text-copy-primary">
          <Sparkles className="h-4 w-4 text-ai-text" />
          AI Assistant
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI sidebar"
          onClick={onClose}
          className="text-copy-muted hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="text-copy-faint">
          <Sparkles className="h-8 w-8" />
        </span>
        <p className="text-sm font-medium text-copy-secondary">AI chat is coming soon</p>
        <p className="text-xs text-copy-muted">
          You will be able to describe a system here and have it drawn on the canvas.
        </p>
      </div>
    </aside>
  );
}
