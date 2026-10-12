import type { XYPosition } from "@xyflow/react";

import { DEFAULT_NODE_COLOR, type CanvasNode, type ShapeDragPayload } from "@/types/canvas";

// Distinguishes nodes created in the same millisecond. Per tab, so it only has to make IDs
// unique for this client; the timestamp separates clients.
let nodeCounter = 0;

// A new, empty node of the dragged shape, at its default size and color.
export function createCanvasNode(payload: ShapeDragPayload, position: XYPosition): CanvasNode {
  nodeCounter += 1;

  return {
    id: `${payload.shape}-${Date.now()}-${nodeCounter}`,
    type: "canvasNode",
    position,
    width: payload.width,
    height: payload.height,
    data: { label: "", color: DEFAULT_NODE_COLOR.fill, shape: payload.shape },
  };
}
