"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { CreateProjectDialog } from "@/components/dialogs/create-project-dialog";
import { DeleteProjectDialog } from "@/components/dialogs/delete-project-dialog";
import { RenameProjectDialog } from "@/components/dialogs/rename-project-dialog";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { useProjectList } from "@/hooks/use-project-list";
import type { Project } from "@/types/project";

interface ProjectsContextValue {
  projects: Project[];
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

interface ProjectsProviderProps {
  initialProjects: Project[];
  children: ReactNode;
}

export function ProjectsProvider({
  initialProjects,
  children,
}: ProjectsProviderProps) {
  const { projects, createProject, renameProject, deleteProject } =
    useProjectList(initialProjects);
  const {
    openDialog,
    targetProject,
    name,
    slug,
    isLoading,
    setName,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  } = useProjectDialogs({
    onCreate: createProject,
    onRename: renameProject,
    onDelete: deleteProject,
  });

  const value = useMemo(
    () => ({ projects, openCreate, openRename, openDelete }),
    [projects, openCreate, openRename, openDelete]
  );

  function handleOpenChange(open: boolean) {
    if (!open) close();
  }

  return (
    <ProjectsContext value={value}>
      {children}
      <CreateProjectDialog
        open={openDialog === "create"}
        onOpenChange={handleOpenChange}
        name={name}
        onNameChange={setName}
        slug={slug}
        isLoading={isLoading}
        onSubmit={submit}
      />
      <RenameProjectDialog
        open={openDialog === "rename"}
        onOpenChange={handleOpenChange}
        project={targetProject}
        name={name}
        onNameChange={setName}
        isLoading={isLoading}
        onSubmit={submit}
      />
      <DeleteProjectDialog
        open={openDialog === "delete"}
        onOpenChange={handleOpenChange}
        project={targetProject}
        isLoading={isLoading}
        onConfirm={submit}
      />
    </ProjectsContext>
  );
}

export function useProjects(): ProjectsContextValue {
  const value = useContext(ProjectsContext);
  if (!value) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }
  return value;
}
