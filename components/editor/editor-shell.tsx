"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectsProvider } from "@/components/editor/projects-provider";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

interface EditorShellProps {
  children: ReactNode;
}

export function EditorShell({ children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProjectsProvider initialProjects={MOCK_PROJECTS}>
      <div className="flex h-dvh flex-col overflow-hidden bg-base">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProjectsProvider>
  );
}
