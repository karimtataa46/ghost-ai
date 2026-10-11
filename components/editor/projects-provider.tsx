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
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/types/project";

interface ProjectsContextValue {
  ownedProjects: Project[];
  sharedProjects: Project[];
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

interface ProjectsProviderProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
  children: ReactNode;
}

export function ProjectsProvider({
  ownedProjects,
  sharedProjects,
  children,
}: ProjectsProviderProps) {
  const {
    openDialog,
    targetProject,
    name,
    roomId,
    isLoading,
    error,
    setName,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  } = useProjectActions();

  const value = useMemo(
    () => ({ ownedProjects, sharedProjects, openCreate, openRename, openDelete }),
    [ownedProjects, sharedProjects, openCreate, openRename, openDelete]
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
        roomId={roomId}
        isLoading={isLoading}
        error={error}
        onSubmit={submit}
      />
      <RenameProjectDialog
        open={openDialog === "rename"}
        onOpenChange={handleOpenChange}
        project={targetProject}
        name={name}
        onNameChange={setName}
        isLoading={isLoading}
        error={error}
        onSubmit={submit}
      />
      <DeleteProjectDialog
        open={openDialog === "delete"}
        onOpenChange={handleOpenChange}
        project={targetProject}
        isLoading={isLoading}
        error={error}
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
