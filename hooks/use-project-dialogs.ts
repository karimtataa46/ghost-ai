"use client";

import { useCallback, useState } from "react";

import { createShortId } from "@/lib/short-id";
import { resolveSlug } from "@/lib/slugify";
import type { Project } from "@/types/project";

export type ProjectDialogKind = "create" | "rename" | "delete";

interface ProjectDialogHandlers {
  onCreate: (name: string, slug: string) => void;
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
  // Fixed per Create dialog so the previewed fallback slug is the one that gets saved.
  const [slugSuffix, setSlugSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = resolveSlug(name, slugSuffix);

  const openCreate = useCallback(() => {
    setName("");
    setSlugSuffix(createShortId());
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
    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_SUBMIT_DELAY_MS));

      if (openDialog === "create") {
        onCreate(trimmedName, slug);
      } else if (targetProject) {
        if (openDialog === "rename") onRename(targetProject.id, trimmedName);
        else onDelete(targetProject.id);
      }

      setOpenDialog(null);
    } finally {
      // If a handler throws, the dialog stays open and usable instead of stuck on "loading".
      setIsLoading(false);
    }
  }, [
    isLoading,
    openDialog,
    name,
    slug,
    targetProject,
    onCreate,
    onRename,
    onDelete,
  ]);

  return {
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
  };
}
