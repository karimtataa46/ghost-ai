"use client";

import { Bot, X } from "lucide-react";

import { AiArchitectTab } from "@/components/editor/ai-architect-tab";
import { AiSpecsTab } from "@/components/editor/ai-specs-tab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// The shadcn trigger paints its active tab with `bg-background` / `text-foreground`; this swaps
// in the AI accent. The `dark:` copies are needed because the trigger sets its own `dark:` colors.
const TAB_TRIGGER_CLASS =
  "data-active:bg-ai/15 data-active:text-ai-text data-active:hover:text-ai-text dark:data-active:border-transparent dark:data-active:bg-ai/15 dark:data-active:text-ai-text dark:data-active:hover:text-ai-text";

// The AI sidebar: a floating panel that mirrors `ProjectSidebar` and slides in from the right
// over the canvas without resizing it. The parent owns whether it is open. Must render under a
// `RoomProvider` (the AI Architect tab reads the room's chat, presence, and AI status feed).
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      aria-label="AI workspace"
      aria-hidden={!isOpen}
      className={cn(
        "absolute top-3 right-3 bottom-3 z-30 flex w-80 max-w-[calc(100%-1.5rem)] flex-col rounded-2xl border border-surface-border bg-base/95 backdrop-blur-xl",
        "transition-[transform,visibility] duration-200 ease-out",
        isOpen ? "visible translate-x-0" : "invisible translate-x-[calc(100%+0.75rem)]"
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-surface-border py-3 pr-2 pl-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium text-copy-primary">AI Workspace</h2>
          <p className="truncate text-xs text-copy-muted">Collaborate with Ghost AI</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI sidebar"
          onClick={onClose}
          className="shrink-0 text-copy-muted hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0 p-3">
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="architect" className={TAB_TRIGGER_CLASS}>
            AI Architect
          </TabsTrigger>
          <TabsTrigger value="specs" className={TAB_TRIGGER_CLASS}>
            Specs
          </TabsTrigger>
        </TabsList>
        {/* Kept mounted while hidden, so the conversation and the draft survive a tab switch. */}
        <TabsContent value="architect" keepMounted className="mt-3 flex min-h-0 flex-1 flex-col">
          <AiArchitectTab />
        </TabsContent>
        <TabsContent value="specs" className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <AiSpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
