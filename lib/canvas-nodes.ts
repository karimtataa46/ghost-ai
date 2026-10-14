import type { NodeSelectionChange, XYPosition } from "@xyflow/react";

import { SHAPE_DEFAULT_COLORS, type CanvasNode, type ShapeDragPayload } from "@/types/canvas";

// Distinguishes nodes created in the same millisecond. Per tab, so it only has to make IDs
// unique for this client; the timestamp separates clients.
let nodeCounter = 0;

// A new, empty node of the dragged shape, at its default size and its shape's default color.
export function createCanvasNode(payload: ShapeDragPayload, position: XYPosition): CanvasNode {
  nodeCounter += 1;

  return {
    id: `${payload.shape}-${Date.now()}-${nodeCounter}`,
    type: "canvasNode",
    position,
    width: payload.width,
    height: payload.height,
    data: { label: "", color: SHAPE_DEFAULT_COLORS[payload.shape], shape: payload.shape },
  };
}

// The changes that select every node that is not selected yet, for the canvas's `onNodesChange`.
// Liveblocks keeps selection local (it is not written to Storage or undo history, and other
// people do not see it), so this only changes what this client has selected.
export function selectAllNodes(nodes: CanvasNode[]): NodeSelectionChange[] {
  return nodes
    .filter((node) => !node.selected)
    .map((node) => ({ id: node.id, type: "select", selected: true }));
}
