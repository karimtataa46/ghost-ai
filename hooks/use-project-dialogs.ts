"use client";

import { useCallback, useState } from "react";

import { slugify } from "@/lib/slugify";
import type { Project } from "@/types/project";

export type ProjectDialogKind = "create" | "rename" | "delete";

interface ProjectDialogHandlers {
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const MOCK_SUBMIT_DELAY_MS = 600;

export function useProjectDialogs({
  onCreate,
  onRename,
  onDelete,
}: ProjectDialogHandlers) {
  const [openDialog, setOpenDialog] = useState<ProjectDialogKind | null>(null);
  // Kept after close so the dialog content doesn't change during its exit animation.
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const openCreate = useCallback(() => {
    setName("");
    setOpenDialog("create");
  }, []);

  const openRename = useCallback((project: Project) => {
    setTargetProject(project);
    setName(project.name);
    setOpenDialog("rename");
  }, []);

  const openDelete = useCallback((project: Project) => {
    setTargetProject(project);
    setOpenDialog("delete");
  }, []);

  const close = useCallback(() => {
    if (isLoading) return;
    setOpenDialog(null);
  }, [isLoading]);

  // The wait stands in for the project API call until it exists.
  const submit = useCallback(async () => {
    if (isLoading || openDialog === null) return;
    const trimmedName = name.trim();
    if (openDialog !== "delete" && trimmedName === "") return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, MOCK_SUBMIT_DELAY_MS));

    if (openDialog === "create") {
      onCreate(trimmedName);
    } else if (targetProject) {
      if (openDialog === "rename") onRename(targetProject.id, trimmedName);
      else onDelete(targetProject.id);
    }

    setIsLoading(false);
    setOpenDialog(null);
  }, [
    isLoading,
    openDialog,
    name,
    targetProject,
    onCreate,
    onRename,
    onDelete,
  ]);

  return {
    openDialog,
    targetProject,
    name,
    slug: slugify(name),
    isLoading,
    setName,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  };
}
