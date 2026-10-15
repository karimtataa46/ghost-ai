"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  useStore,
  type EdgeProps,
  type ReactFlowState,
} from "@xyflow/react";
import { X } from "lucide-react";
import { useState } from "react";

import { EdgeLabelEditor } from "@/components/editor/edge-label-editor";
import { Button } from "@/components/ui/button";
import { SELECTED_EDGE_STYLE } from "@/lib/canvas-edges";
import { cn } from "@/lib/utils";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

// True when exactly one edge is selected. Selecting a box of nodes also selects the edges between
// them, and a delete button on each of those would litter the diagram; Backspace / Delete still
// remove the whole selection.
function isOnlySelectedEdge(state: ReactFlowState) {
  let count = 0;

  for (const edge of state.edges) {
    if (edge.selected) count += 1;
    if (count > 1) return false;
  }

  return count === 1;
}

// How far the delete button sits to the right of what is on the edge's midpoint, in screen pixels:
// close to the text when there is some, and clear of the line's hit area (the 20px
// `interactionWidth`) when there is none.
const DELETE_BUTTON_GAP_PX = 4;
const DELETE_BUTTON_GAP_NO_TEXT_PX = 16;

interface EdgeDeleteButtonProps {
  edgeId: string;
  // Whether the edge's text is drawn at the midpoint.
  hasText: boolean;
}

// The button on a selected edge, positioned inside the box `CanvasEdgeRenderer` puts on the edge's
// midpoint, to the right of it and never on it: the midpoint is where people double-click to add
// text, and the first click of a double-click selects the edge and shows this button, so a button
// under the second click would delete the edge instead of opening the editor. It asks React Flow to
// delete the edge, which calls the canvas's Liveblocks `onDelete`, the same path the Backspace /
// Delete keys take, so the edge is removed from the room's Storage for everyone and is one undo
// step. Nothing is written locally.
function EdgeDeleteButton({ edgeId, hasText }: EdgeDeleteButtonProps) {
  const { deleteElements } = useReactFlow<CanvasNode, CanvasEdge>();
  // The label layer pans and zooms with the canvas. Scaling by the inverse of the zoom keeps the
  // button, and its gap, the same size on screen, so it stays easy to hit when the diagram is
  // zoomed out.
  const scale = 1 / useStore((state) => state.transform[2]);
  const gap = (hasText ? DELETE_BUTTON_GAP_PX : DELETE_BUTTON_GAP_NO_TEXT_PX) * scale;

  return (
    <div
      className="absolute top-1/2 left-full"
      style={{ transform: `translate(${gap}px, -50%) scale(${scale})`, transformOrigin: "left center" }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Delete connection"
        title="Delete connection"
        onClick={() => void deleteElements({ edges: [{ id: edgeId }] })}
        className="rounded-full border-surface-border bg-elevated text-copy-secondary shadow-lg hover:text-state-error"
      >
        <X />
      </Button>
    </div>
  );
}

// Draws every edge (registered under `CANVAS_EDGE_TYPE` in `canvas.tsx`): React Flow's smooth-step
// path, with the style it was given (`defaultEdgeOptions`), and the edge's text on its midpoint.
// - Double-clicking the edge or its text opens the text editor (`isEditing`, UI state only, never
//   synced). Closing it writes the text through React Flow's `updateEdge`, which reaches the
//   room's Storage as a `replace` change in the Liveblocks `onEdgesChange`, as a node's label does;
//   emptied text removes the `label` key.
// - While the edge is selected it is highlighted, and when it is the only selected edge it carries
//   a delete button at its midpoint.
// Selection is local to each client and is not synced; the text and the delete are.
export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  interactionWidth,
  label,
  selected,
}: EdgeProps) {
  const { updateEdge } = useReactFlow<CanvasNode, CanvasEdge>();
  const [isEditing, setIsEditing] = useState(false);
  const isOnlySelected = useStore((state) => Boolean(selected) && isOnlySelectedEdge(state));
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  // `label` is typed as any React node, but what is stored is always a string (`parseEdge` in
  // `lib/canvas-snapshot.ts` keeps nothing else), so anything else is drawn as no text.
  const text = typeof label === "string" ? label : "";
  const showDelete = isOnlySelected && !isEditing;

  function saveText(next: string) {
    setIsEditing(false);

    const trimmed = next.trim();
    if (trimmed === text) return;

    // `undefined` deletes the key from Storage (Liveblocks' `reconcile`), so a cleared text leaves
    // no empty `label` behind.
    updateEdge(id, { label: trimmed === "" ? undefined : trimmed });
  }

  return (
    <>
      {/* The double-click lands on the edge's wide, invisible hit path (`BaseEdge`'s
          `interactionWidth`), so the thin line is easy to hit. React Flow's edge group already has
          `nopan`, so it does not zoom the canvas. The edge is selected by the first click. */}
      <g onDoubleClick={() => setIsEditing(true)}>
        <BaseEdge
          id={id}
          path={path}
          markerEnd={markerEnd}
          style={selected ? { ...style, ...SELECTED_EDGE_STYLE } : style}
          interactionWidth={interactionWidth}
        />
      </g>
      {(isEditing || text !== "" || showDelete) && (
        <EdgeLabelRenderer>
          {/* A box on the midpoint that scales with the canvas, so the text keeps its size next to
              the nodes' own text. `nodrag nopan` keep a press on it from starting a canvas drag
              or pan (and a double-click from zooming); React Flow's label layer ignores the
              pointer unless it is switched back on here. A click on the text selects the edge:
              React passes it through the portal to the edge's own click handler. */}
          <div
            className="nodrag nopan pointer-events-auto absolute"
            style={{ transform: `translate(${labelX}px, ${labelY}px) translate(-50%, -50%)` }}
          >
            {isEditing ? (
              <EdgeLabelEditor initialLabel={text} onClose={saveText} />
            ) : (
              text !== "" && (
                <div
                  className={cn(
                    "max-w-48 rounded-xl border bg-base px-2 py-0.5 text-center text-xs whitespace-pre-wrap text-copy-primary wrap-anywhere",
                    selected ? "border-brand" : "border-surface-border",
                  )}
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {text}
                </div>
              )
            )}
            {showDelete && <EdgeDeleteButton edgeId={id} hasText={text !== ""} />}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
