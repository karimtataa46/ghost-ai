"use client";

import { useCallback, useEffect, useState } from "react";

import {
  inviteCollaborator,
  listCollaborators,
  removeCollaborator,
} from "@/lib/collaborator-api";
import { ProjectApiError } from "@/lib/project-api";
import type { Collaborator } from "@/types/collaborator";

function messageFrom(error: unknown) {
  return error instanceof ProjectApiError ? error.message : "Something went wrong. Try again.";
}

// State and actions for the share dialog's collaborator list. Loads on mount, so mount it
// where the dialog content mounts and the list is fresh each time the dialog opens.
export function useCollaborators(projectId: string) {
  // Null until the first load finishes.
  const [collaborators, setCollaborators] = useState<Collaborator[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listCollaborators(projectId)
      .then((list) => {
        if (cancelled) return;
        setCollaborators(list);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(messageFrom(error));
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, reloadCount]);

  const reload = useCallback(() => {
    setLoadError(null);
    setReloadCount((count) => count + 1);
  }, []);

  // Resolves true when the invite went through, so the form can clear its input.
  const invite = useCallback(
    async (email: string) => {
      setIsInviting(true);
      setInviteError(null);

      try {
        const collaborator = await inviteCollaborator(projectId, email);
        setCollaborators((current) => [...(current ?? []), collaborator]);
        return true;
      } catch (error) {
        setInviteError(messageFrom(error));
        return false;
      } finally {
        setIsInviting(false);
      }
    },
    [projectId]
  );

  const remove = useCallback(
    async (collaboratorId: string) => {
      setRemovingId(collaboratorId);
      setRemoveError(null);

      try {
        await removeCollaborator(projectId, collaboratorId);
        setCollaborators((current) =>
          (current ?? []).filter((collaborator) => collaborator.id !== collaboratorId)
        );
      } catch (error) {
        setRemoveError(messageFrom(error));
      } finally {
        setRemovingId(null);
      }
    },
    [projectId]
  );

  return {
    collaborators,
    loadError,
    isInviting,
    inviteError,
    removingId,
    removeError,
    reload,
    invite,
    remove,
  };
}
