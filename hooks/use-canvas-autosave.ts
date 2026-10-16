"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { saveCanvas } from "@/lib/canvas-api";
import { parseCanvasSnapshot } from "@/lib/canvas-snapshot";
import type { CanvasEdge, CanvasNode, CanvasSaveStatus } from "@/types/canvas";

// How long the canvas has to sit unchanged before it is saved. A drag or a burst of typing
// changes the nodes many times a second; this turns that into one save once it settles.
export const AUTOSAVE_DELAY_MS = 2000;

interface CanvasAutosaveOptions {
  projectId: string;
  // The live canvas, from `useLiveblocksFlow`. A change by anyone in the room counts, so the
  // saved copy follows the shared state rather than one person's edits.
  nodes: readonly CanvasNode[];
  edges: readonly CanvasEdge[];
  // False until the saved canvas has been restored (or there was none to restore). Saving before
  // that would replace the stored canvas with the empty one the editor starts with.
  enabled: boolean;
}

// Saves the canvas through `PUT /api/projects/[projectId]/canvas` a moment after it stops
// changing, one request at a time, and tracks the result. A change that does not alter what is
// saved (selecting a node, which changes the React Flow state but not the diagram) saves nothing.
// `saveNow` saves right away even if nothing changed, and retries after an error. The canvas as
// it is when saving first becomes possible counts as already saved, so opening a project does
// not write anything. A pending change is saved when the canvas unmounts.
export function useCanvasAutosave({ projectId, nodes, edges, enabled }: CanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  // Bumped to start a new debounce when a change arrived while a save was running.
  const [revision, setRevision] = useState(0);

  // The newest canvas, for the timer and the Save button to read.
  const latest = useRef({ nodes, edges });
  // The serialized canvas that matches the stored copy, to tell a real change from a no-op one.
  const synced = useRef<string | null>(null);
  const isSaving = useRef(false);
  const changedWhileSaving = useRef(false);

  useEffect(() => {
    latest.current = { nodes, edges };
  });

  const save = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (isSaving.current) {
        // The save in progress starts a new debounce when it ends.
        changedWhileSaving.current = true;
        return;
      }

      const snapshot = parseCanvasSnapshot(latest.current);

      if (!snapshot) {
        setError("The canvas has content that cannot be saved.");
        setStatus("error");
        return;
      }

      const serialized = JSON.stringify(snapshot);

      if (!force && serialized === synced.current) return;

      isSaving.current = true;
      setStatus("saving");
      setError(null);

      try {
        await saveCanvas(projectId, snapshot);
        synced.current = serialized;
        setStatus("saved");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the canvas.");
        setStatus("error");
      } finally {
        isSaving.current = false;
      }

      if (changedWhileSaving.current) {
        changedWhileSaving.current = false;
        setRevision((current) => current + 1);
      }
    },
    [projectId],
  );

  // Declared after the effect that updates `latest`, so it reads the canvas of this render.
  useEffect(() => {
    if (!enabled) return;

    const snapshot = parseCanvasSnapshot(latest.current);

    synced.current = snapshot ? JSON.stringify(snapshot) : null;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => void save(), AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [enabled, nodes, edges, revision, save]);

  // Leaving the project within the delay of an edit would otherwise drop that edit.
  useEffect(() => {
    if (!enabled) return;

    return () => void save();
  }, [enabled, save]);

  const saveNow = useCallback(() => void save({ force: true }), [save]);

  return { status, error, saveNow };
}
