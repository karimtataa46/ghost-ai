"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FolderOpen, Pencil, Plus, Trash2, Users, X } from "lucide-react";

import { useProjects } from "@/components/editor/projects-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // The workspace's project (room), highlighted in the lists.
  activeProjectId?: string;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

interface ProjectItemProps {
  project: Project;
  // Only owners can rename or delete; the API enforces this too.
  canManage: boolean;
  isActive: boolean;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="text-copy-faint">{icon}</span>
      <p className="text-sm font-medium text-copy-secondary">{title}</p>
      <p className="text-xs text-copy-muted">{description}</p>
    </div>
  );
}

function ProjectItem({
  project,
  canManage,
  isActive,
  onRename,
  onDelete,
}: ProjectItemProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-1 rounded-xl py-1 pr-1 pl-3",
        isActive ? "bg-accent-dim" : "hover:bg-subtle/60"
      )}
    >
      <Link
        href={`/editor/${project.id}`}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "min-w-0 flex-1 truncate rounded-md py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isActive ? "font-medium text-brand" : "text-copy-secondary hover:text-copy-primary"
        )}
      >
        {project.name}
      </Link>
      {canManage && (
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Rename ${project.name}`}
            onClick={() => onRename(project)}
            className="text-copy-muted hover:text-copy-primary"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${project.name}`}
            onClick={() => onDelete(project)}
            className="text-copy-muted hover:text-state-error"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </li>
  );
}

interface ProjectListProps extends Omit<ProjectItemProps, "project" | "isActive"> {
  projects: Project[];
  activeProjectId?: string;
  emptyState: ReactNode;
}

function ProjectList({
  projects,
  activeProjectId,
  canManage,
  emptyState,
  onRename,
  onDelete,
}: ProjectListProps) {
  if (projects.length === 0) return emptyState;

  return (
    <ul className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          canManage={canManage}
          isActive={project.id === activeProjectId}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  activeProjectId,
}: ProjectSidebarProps) {
  const { ownedProjects, sharedProjects, openCreate, openRename, openDelete } =
    useProjects();
  // Open on the tab that holds the current room, so its highlight is visible.
  const defaultTab = sharedProjects.some((project) => project.id === activeProjectId)
    ? "shared"
    : "my-projects";

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 z-20 bg-base/70 md:hidden",
          "transition-[opacity,visibility] duration-200 ease-out",
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
      />
      <aside
        aria-label="Projects"
        aria-hidden={!isOpen}
        className={cn(
          "absolute top-3 bottom-3 left-3 z-30 flex w-72 flex-col rounded-2xl border border-surface-border bg-surface/90 backdrop-blur-xl",
          "transition-[transform,visibility] duration-200 ease-out",
          isOpen ? "visible translate-x-0" : "invisible -translate-x-[calc(100%+0.75rem)]"
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border pr-2 pl-4">
          <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close sidebar"
            onClick={onClose}
            className="text-copy-muted hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue={defaultTab} className="min-h-0 flex-1 gap-0 p-3">
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          <TabsContent
            value="my-projects"
            className="mt-3 min-h-0 flex-1 overflow-y-auto"
          >
            <ProjectList
              projects={ownedProjects}
              activeProjectId={activeProjectId}
              canManage
              onRename={openRename}
              onDelete={openDelete}
              emptyState={
                <EmptyState
                  icon={<FolderOpen className="h-8 w-8" />}
                  title="No projects yet"
                  description="Projects you create will appear here."
                />
              }
            />
          </TabsContent>
          <TabsContent
            value="shared"
            className="mt-3 min-h-0 flex-1 overflow-y-auto"
          >
            <ProjectList
              projects={sharedProjects}
              activeProjectId={activeProjectId}
              canManage={false}
              onRename={openRename}
              onDelete={openDelete}
              emptyState={
                <EmptyState
                  icon={<Users className="h-8 w-8" />}
                  title="Nothing shared yet"
                  description="Projects shared with you will appear here."
                />
              }
            />
          </TabsContent>
        </Tabs>

        <div className="shrink-0 border-t border-surface-border p-3">
          <Button className="w-full" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
