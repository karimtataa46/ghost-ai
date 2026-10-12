"use client";

import { useReactFlow, type OnNodesChange } from "@xyflow/react";
import type { DragEvent } from "react";

import { isShapeDrag, readShapeDragPayload } from "@/lib/canvas-drag";
import { createCanvasNode } from "@/lib/canvas-nodes";
import type { CanvasNode } from "@/types/canvas";

// Drag handlers for the canvas wrapper: a shape dragged from the shape panel and dropped on
// it becomes a new node at the drop point. Must run under a `ReactFlowProvider`, because
// the drop's screen position is converted to canvas coordinates through React Flow.
export function useShapeDrop(onNodesChange: OnNodesChange<CanvasNode>) {
  const { screenToFlowPosition } = useReactFlow();

  // Without `preventDefault` the browser refuses the drop. Only shape drags are accepted.
  function onDragOver(event: DragEvent<HTMLElement>) {
    if (!isShapeDrag(event.dataTransfer)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    if (!isShapeDrag(event.dataTransfer)) return;

    event.preventDefault();
    const payload = readShapeDragPayload(event.dataTransfer);
    if (!payload) return;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    onNodesChange([{ type: "add", item: createCanvasNode(payload, position) }]);
  }

  return { onDragOver, onDrop };
}
