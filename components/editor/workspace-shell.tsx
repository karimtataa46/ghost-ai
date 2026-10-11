"use client";

import { useState, type ReactNode } from "react";
import { Share2, Sparkles } from "lucide-react";

import { ShareDialog } from "@/components/dialogs/share-dialog";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";
import type { WorkspaceProject } from "@/types/project";

interface WorkspaceShellProps {
  // The open project, with the viewer's role; its ID is the Liveblocks room ID.
  project: WorkspaceProject;
  // The canvas area.
  children: ReactNode;
}

// Editor chrome for an open project: project name in the navbar, Share and AI sidebar
// toggle actions, the project sidebar on the left and the AI sidebar on the right, both
// floating over the canvas, and the share dialog. Must render under `ProjectsProvider`.
export function WorkspaceShell({ project, children }: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        title={project.name}
        actions={
          <>
            <Button variant="outline" aria-label="Share" onClick={() => setIsShareOpen(true)}>
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
              aria-expanded={isAiSidebarOpen}
              onClick={() => setIsAiSidebarOpen((open) => !open)}
              className="text-copy-muted hover:text-copy-primary aria-expanded:text-ai-text"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </>
        }
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeProjectId={project.id}
        />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <AiSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
        />
      </div>
      <ShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} project={project} />
    </div>
  );
}
