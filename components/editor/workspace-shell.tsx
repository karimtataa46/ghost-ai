"use client";

import { useCallback, useState, type ReactNode } from "react";
import { LayoutTemplate, Share2, Sparkles } from "lucide-react";

import { ShareDialog } from "@/components/dialogs/share-dialog";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { CanvasSaveButton } from "@/components/editor/canvas-save-button";
import {
  CanvasSaveProvider,
  type CanvasSaveControls,
} from "@/components/editor/canvas-save-provider";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import {
  TemplateImportProvider,
  type TemplateImporter,
} from "@/components/editor/template-import-provider";
import { Button } from "@/components/ui/button";
import type { WorkspaceProject } from "@/types/project";

interface WorkspaceShellProps {
  // The open project, with the viewer's role; its ID is the Liveblocks room ID.
  project: WorkspaceProject;
  // The canvas area.
  children: ReactNode;
}

// Editor chrome for an open project: project name in the navbar, Save (with the autosave status),
// Templates, Share and AI sidebar toggle actions, the project sidebar on the left and the AI
// sidebar on the right, both floating over the canvas, and the share and starter templates
// dialogs. Must render under `ProjectsProvider`.
export function WorkspaceShell({ project, children }: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  // The mounted canvas's save state, or `null` while there is no canvas (loading, or a failed
  // connection).
  const [saveControls, setSaveControls] = useState<CanvasSaveControls | null>(null);
  // The mounted canvas's template importer, or `null` while there is no canvas (loading, or a
  // failed connection). The function is wrapped because `setState` would call it as an updater.
  const [importTemplate, setImportTemplate] = useState<TemplateImporter | null>(null);
  const registerImporter = useCallback(
    (importer: TemplateImporter | null) => setImportTemplate(() => importer),
    [],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        title={project.name}
        actions={
          <>
            {/* Disabled until the canvas has connected and loaded, since it owns the save state. */}
            <CanvasSaveButton controls={saveControls} />
            {/* Disabled until the canvas has connected, since importing needs its room. */}
            <Button
              variant="outline"
              aria-label="Starter templates"
              disabled={!importTemplate}
              onClick={() => setIsTemplatesOpen(true)}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </Button>
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
        <main className="flex min-h-0 flex-1 flex-col">
          <CanvasSaveProvider onRegister={setSaveControls}>
            <TemplateImportProvider onRegister={registerImporter}>{children}</TemplateImportProvider>
          </CanvasSaveProvider>
        </main>
        <AiSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
        />
      </div>
      <ShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} project={project} />
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onImport={(template) => importTemplate?.(template)}
      />
    </div>
  );
}
