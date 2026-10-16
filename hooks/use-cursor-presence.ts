"use client";

import { useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useReactFlow } from "@xyflow/react";
import { useCallback, type MouseEvent } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

// Broadcasts this user's pointer through Liveblocks presence for `ReactFlow`'s `onMouseMove` and
// `onMouseLeave`. The position is sent in canvas coordinates (`screenToFlowPosition`), not screen
// ones, so it points at the same spot on everyone's canvas whatever their pan and zoom. Presence
// is not Storage: nothing is saved, it adds no undo step, and it disappears when the user leaves.
// Needs a `ReactFlowProvider` above it.
export function useCursorPresence() {
  const updateMyPresence = useUpdateMyPresence();
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      updateMyPresence({
        cursor: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      });
    },
    [updateMyPresence, screenToFlowPosition],
  );

  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return { onMouseMove, onMouseLeave };
}
