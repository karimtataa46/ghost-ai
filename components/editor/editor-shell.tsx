"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectsProvider } from "@/components/editor/projects-provider";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import type { Project } from "@/types/project";

interface EditorShellProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
  children: ReactNode;
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
  children,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProjectsProvider
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    >
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
