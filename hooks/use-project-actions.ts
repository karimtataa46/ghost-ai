"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  createProject,
  deleteProject,
  ProjectApiError,
  renameProject,
} from "@/lib/project-api";
import { createShortId } from "@/lib/short-id";
import { createRoomId } from "@/lib/slugify";
import type { Project } from "@/types/project";

export type ProjectDialogKind = "create" | "rename" | "delete";

const EDITOR_PATH = "/editor";
const CONFLICT_STATUS = 409;

// `/editor/<projectId>` is a workspace; `/editor` is the home.
function getActiveProjectId(pathname: string) {
  const [, root, projectId] = pathname.split("/");
  return root === "editor" && projectId ? decodeURIComponent(projectId) : null;
}

export function useProjectActions() {
  const router = useRouter();
  const activeProjectId = getActiveProjectId(usePathname());

  const [openDialog, setOpenDialog] = useState<ProjectDialogKind | null>(null);
  // Kept after close so the dialog content doesn't change during its exit animation.
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  // Fixed per Create dialog so the previewed room ID is the one that gets saved.
  const [roomIdSuffix, setRoomIdSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Doubles as the project ID, so the project and its Liveblocks room stay aligned.
  const roomId = createRoomId(name, roomIdSuffix);

  const openCreate = useCallback(() => {
    setName("");
    setRoomIdSuffix(createShortId());
    setError(null);
    setOpenDialog("create");
  }, []);

  const openRename = useCallback((project: Project) => {
    setTargetProject(project);
    setName(project.name);
    setError(null);
    setOpenDialog("rename");
  }, []);

  const openDelete = useCallback((project: Project) => {
    setTargetProject(project);
    setError(null);
    setOpenDialog("delete");
  }, []);

  const close = useCallback(() => {
    if (isLoading) return;
    setOpenDialog(null);
  }, [isLoading]);

  const submit = useCallback(async () => {
    if (isLoading || openDialog === null) return;
    const trimmedName = name.trim();
    if (openDialog !== "delete" && trimmedName === "") return;
    if (openDialog !== "create" && !targetProject) return;

    setIsLoading(true);
    setError(null);

    try {
      if (openDialog === "create") {
        const project = await createProject(roomId, trimmedName);
        setOpenDialog(null);
        router.push(`${EDITOR_PATH}/${project.id}`);
        // The sidebar's lists come from the editor layout, which a navigation does not re-render.
        router.refresh();
      } else if (openDialog === "rename" && targetProject) {
        await renameProject(targetProject.id, trimmedName);
        setOpenDialog(null);
        router.refresh();
      } else if (openDialog === "delete" && targetProject) {
        await deleteProject(targetProject.id);
        setOpenDialog(null);
        // Replace, not push: the deleted workspace's URL would be a dead entry in history.
        if (targetProject.id === activeProjectId) router.replace(EDITOR_PATH);
        router.refresh();
      }
    } catch (caught) {
      // The dialog stays open, with the typed name kept, so the user can retry or cancel.
      if (caught instanceof ProjectApiError) {
        setError(caught.message);
        // The room ID is taken: a retry needs a new suffix.
        if (openDialog === "create" && caught.status === CONFLICT_STATUS) {
          setRoomIdSuffix(createShortId());
        }
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, openDialog, name, roomId, targetProject, activeProjectId, router]);

  return {
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
  };
}
