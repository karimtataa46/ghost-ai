"use client";

import { useCallback, useEffect, useState } from "react";

import { ProjectApiError } from "@/lib/project-api";
import { loadSpecContent } from "@/lib/spec-api";

// One spec's Markdown for the preview. Loads on mount and holds the text in this hook's state
// only, so mount it where the preview's body mounts: closing the preview unmounts it and the
// content goes with it, nothing is kept in a shared store or cache.
export function useSpecContent(projectId: string, specId: string) {
  // Null until the load finishes.
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    loadSpecContent(projectId, specId)
      .then((markdown) => {
        if (cancelled) return;
        setContent(markdown);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ProjectApiError ? caught.message : "Something went wrong. Try again."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, specId, reloadCount]);

  const reload = useCallback(() => {
    setError(null);
    setReloadCount((count) => count + 1);
  }, []);

  return { content, error, reload };
}
