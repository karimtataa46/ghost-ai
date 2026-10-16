"use client";

import { useCallback, useEffect, useState } from "react";

import { ProjectApiError } from "@/lib/project-api";
import { listSpecs } from "@/lib/spec-api";
import type { ProjectSpecSummary } from "@/types/spec";

// The Specs tab's list of generated specs (metadata only). Loads on mount, so mount it where the
// tab's content mounts and the list is fresh each time the tab is opened.
export function useProjectSpecs(projectId: string) {
  // Null until the first load finishes.
  const [specs, setSpecs] = useState<ProjectSpecSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listSpecs(projectId)
      .then((list) => {
        if (cancelled) return;
        setSpecs(list);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof ProjectApiError ? error.message : "Something went wrong. Try again."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, reloadCount]);

  const reload = useCallback(() => {
    setLoadError(null);
    setReloadCount((count) => count + 1);
  }, []);

  return { specs, loadError, reload };
}
