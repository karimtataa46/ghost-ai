import { SelectionMode, type ReactFlowProps } from "@xyflow/react";

import type { CanvasTool } from "@/types/canvas";

// The tool a canvas starts with: dragging on empty canvas moves the view, as it always did.
export const DEFAULT_CANVAS_TOOL: CanvasTool = "pan";

// The React Flow props that decide what a drag on empty canvas and the delete keys do, for the
// current tool (`context/ui-context.md`, Canvas Controls). One function so the canvas and
// anything else that renders it the same way read one definition.
//
// - `pan`: a drag moves the view. Holding Shift still draws a selection box (React Flow's own).
// - `select`: a drag draws a selection box, and the nodes it touches become the selection
//   (`SelectionMode.Partial`, so a node does not have to be fully inside). React Flow ignores
//   `selectionOnDrag` while `panOnDrag` is `true`, so the view moves with the middle or right
//   mouse button instead (`[1, 2]`), or with the left button while Space is held (React Flow's
//   own `panActivationKeyCode`).
// - Both: a selection of nodes (and edges) is deleted with Backspace or Delete (React Flow's
//   default is Backspace only), through the canvas's `onDelete`; dragging any selected node
//   moves them all.
export function getCanvasToolProps(
  tool: CanvasTool,
): Pick<ReactFlowProps, "selectionOnDrag" | "panOnDrag" | "selectionMode" | "deleteKeyCode"> {
  return {
    selectionOnDrag: tool === "select",
    panOnDrag: tool === "select" ? [1, 2] : true,
    selectionMode: SelectionMode.Partial,
    deleteKeyCode: ["Backspace", "Delete"],
  };
}
