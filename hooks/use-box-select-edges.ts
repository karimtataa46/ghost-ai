"use client";

import {
  useStoreApi,
  type EdgeSelectionChange,
  type OnEdgesChange,
  type Rect,
} from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";

import { getEdgeIdsCrossingRect } from "@/lib/canvas-selection";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

// Makes the selection box pick edges as well as nodes. React Flow's box selects the nodes it
// touches and only the edges connected to them, so a box drawn over an edge between two nodes it
// does not touch selects nothing. Hand the returned handler to `ReactFlow`'s `onSelectionEnd`: when
// the box is released it also selects every edge the box passes through, on top of what React
// Flow already selected. The edges go through `onEdgesChange` as `select` changes, the same as
// React Flow's own, so selection stays local (not in Storage or undo history, and other people do
// not see it).
export function useBoxSelectEdges(onEdgesChange: OnEdgesChange<CanvasEdge>) {
  const store = useStoreApi<CanvasNode, CanvasEdge>();
  // React Flow clears its selection rectangle just before it calls `onSelectionEnd`, so the last
  // rectangle is kept here while the box is being drawn. It is in screen coordinates, relative to
  // the canvas.
  const lastRect = useRef<Rect | null>(null);

  useEffect(
    () =>
      store.subscribe((state) => {
        if (state.userSelectionRect) lastRect.current = state.userSelectionRect;
      }),
    [store],
  );

  return useCallback(() => {
    const rect = lastRect.current;
    lastRect.current = null;

    const { domNode, transform, edgeLookup } = store.getState();
    if (!rect || !domNode) return;

    const [translateX, translateY, zoom] = transform;
    const canvasRect: Rect = {
      x: (rect.x - translateX) / zoom,
      y: (rect.y - translateY) / zoom,
      width: rect.width / zoom,
      height: rect.height / zoom,
    };

    const changes: EdgeSelectionChange[] = getEdgeIdsCrossingRect(domNode, canvasRect)
      .filter((id) => {
        const edge = edgeLookup.get(id);
        return edge && !edge.selected && edge.selectable !== false;
      })
      .map((id) => ({ id, type: "select", selected: true }));

    if (changes.length > 0) onEdgesChange(changes);
  }, [store, onEdgesChange]);
}
