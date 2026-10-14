"use client";

import { useReactFlow, useStoreApi, type OnNodesChange } from "@xyflow/react";
import type { DragEvent } from "react";

import { isShapeDrag, readShapeDragPayload } from "@/lib/canvas-drag";
import { createCanvasNode } from "@/lib/canvas-nodes";
import type { CanvasNode, ShapeDragPayload } from "@/types/canvas";

// Drag handlers for the canvas wrapper: a shape dragged from the shape panel and dropped on
// it becomes a new node at the drop point. `addShapeAtCenter` is the way in for input that
// cannot drag (keyboard, touch): the same node, centered in the visible canvas. Must run under
// a `ReactFlowProvider`, because screen positions are converted to canvas coordinates through
// React Flow.
export function useShapeDrop(onNodesChange: OnNodesChange<CanvasNode>) {
  const { screenToFlowPosition } = useReactFlow();
  const store = useStoreApi();

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

  // Unlike a drop, which puts the node's top-left corner on the cursor, this centers the node,
  // since there is no cursor to anchor it to. Reads the canvas bounds when it runs, so a resized
  // window or a moved sidebar does not leave it with a stale center.
  function addShapeAtCenter(payload: ShapeDragPayload) {
    const canvas = store.getState().domNode;
    if (!canvas) return;

    const bounds = canvas.getBoundingClientRect();
    const center = screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });
    const position = { x: center.x - payload.width / 2, y: center.y - payload.height / 2 };
    onNodesChange([{ type: "add", item: createCanvasNode(payload, position) }]);
  }

  return { onDragOver, onDrop, addShapeAtCenter };
}
