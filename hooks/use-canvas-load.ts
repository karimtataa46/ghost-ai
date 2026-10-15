"use client";

import { useHistory } from "@liveblocks/react/suspense";
import {
  useReactFlow,
  type EdgeChange,
  type NodeChange,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { useCallback, useEffect, useEffectEvent, useState } from "react";

import { loadCanvas } from "@/lib/canvas-api";
import type { CanvasEdge, CanvasNode, CanvasSnapshot } from "@/types/canvas";

// `loading` while the saved canvas is being fetched, `ready` once there is nothing left to load
// (it was loaded, there was none, or the room already had content), `failed` when the fetch failed.
export type CanvasLoadState = "loading" | "ready" | "failed";

interface CanvasLoadOptions {
  projectId: string;
  // Whether the room already had nodes or edges when the canvas mounted. Then the saved canvas is
  // never fetched: the room's own state is the live one.
  roomHasContent: boolean;
  // The collaborative canvas state's handlers, from `useLiveblocksFlow`.
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
}

// Restores the project's saved canvas into an empty room. Liveblocks keeps a room's Storage
// itself, so this only matters for a room that starts empty (a project whose room is new again);
// a room that has nodes or edges is left alone, so a restore can never overwrite what people are
// working on, and it is checked again after the fetch in case someone added something meanwhile.
// The write goes through the canvas's own Liveblocks handlers, so every collaborator gets it, and
// outside the undo history, so Undo cannot wipe the restored canvas. Must run under a
// `ReactFlowProvider`, after `useLiveblocksFlow` (which creates the flow in Storage).
export function useCanvasLoad({
  projectId,
  roomHasContent,
  onNodesChange,
  onEdgesChange,
}: CanvasLoadOptions) {
  const history = useHistory();
  const { getNodes, getEdges, fitView } = useReactFlow<CanvasNode, CanvasEdge>();
  const [state, setState] = useState<CanvasLoadState>(roomHasContent ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);

  // Runs from the effect below, with the newest handlers and room state at the time it is called,
  // so a changed handler never restarts the fetch.
  const restore = useEffectEvent((snapshot: CanvasSnapshot | null) => {
    const roomIsEmpty = getNodes().length === 0 && getEdges().length === 0;

    if (!snapshot || !roomIsEmpty) return;
    if (snapshot.nodes.length === 0 && snapshot.edges.length === 0) return;

    history.disable(() => {
      onNodesChange(snapshot.nodes.map((item): NodeChange<CanvasNode> => ({ type: "add", item })));
      onEdgesChange(snapshot.edges.map((item): EdgeChange<CanvasEdge> => ({ type: "add", item })));
    });
    // The view was fitted to an empty canvas when it mounted.
    void fitView();
  });

  useEffect(() => {
    if (state !== "loading") return;

    let cancelled = false;

    loadCanvas(projectId).then(
      (snapshot) => {
        if (cancelled) return;

        restore(snapshot);
        setState("ready");
      },
      (caught: unknown) => {
        if (cancelled) return;

        setError(caught instanceof Error ? caught.message : "Could not load the saved canvas.");
        setState("failed");
      },
    );

    return () => {
      cancelled = true;
    };
  }, [state, projectId]);

  const retry = useCallback(() => {
    setError(null);
    setState("loading");
  }, []);

  return { state, error, retry };
}
