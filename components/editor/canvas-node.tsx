"use client";

import { Handle, NodeResizer, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { memo, useCallback, useState } from "react";

import { CanvasShape } from "@/components/editor/canvas-shape";
import { NodeLabelEditor } from "@/components/editor/node-label-editor";
import { useShapeColors } from "@/components/editor/shape-colors-provider";
import {
  NODE_MIN_SIZE,
  SHAPE_DEFAULT_SIZES,
  isNodeShape,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

const HANDLE_SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left];

// Renderer for `canvasNode`. Everything it draws comes from the node in the collaborative
// canvas state (`data` and the size, synced through Liveblocks); the look of each shape lives
// in `CanvasShape`. Resizing and label edits both go through React Flow's change flow, which
// the canvas hands to Liveblocks, so they sync like every other node change.
function CanvasNodeView({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  // Whether this user has the label editor open. Local to this tab: only the label text it
  // produces is shared.
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = useCallback(() => setIsEditing(true), []);
  const stopEditing = useCallback(() => setIsEditing(false), []);
  // `updateNodeData` queues a `replace` change for this node, which reaches the Liveblocks
  // `onNodesChange` that the canvas passes to `ReactFlow`.
  const changeLabel = useCallback(
    (label: string) => updateNodeData(id, { label }),
    [id, updateNodeData],
  );
  const { getColor } = useShapeColors();

  // Storage is shared and outlives this code, so a node with a shape this version does not
  // know draws as a rectangle instead of breaking the canvas.
  const shape = isNodeShape(data.shape) ? data.shape : "rectangle";
  // The shape panel always sets a size; a node without one gets its shape's default. React
  // Flow reports `0`, not `undefined`, for a node that has no size and has not been measured,
  // and a 0x0 shape would never be measured, so zero counts as missing.
  const size = SHAPE_DEFAULT_SIZES[shape];

  return (
    // `group` lets the handles appear while the node, or a handle itself, is hovered.
    <div className="group relative">
      <CanvasShape
        shape={shape}
        // Every node of a shape has the shape's color (picked in the shape panel), not its own.
        color={getColor(shape)}
        label={data.label}
        selected={selected}
        width={width || size.width}
        height={height || size.height}
        labelEditor={
          isEditing ? (
            <NodeLabelEditor
              initialLabel={data.label}
              onChange={changeLabel}
              onClose={stopEditing}
            />
          ) : undefined
        }
        onEditLabel={startEditing}
      />
      {/* Corner handles and edge lines while selected. React Flow turns a drag into
          `dimensions` (and `position`, when a top or left side moves) changes. After the shape
          in the DOM so it paints over it: the corner handles sit half inside the node, and
          the shape would otherwise cover that half and take the drag as a node move.
          `keepAspectRatio` locks the ratio the node had when the drag started, so a resize only
          scales it (a side line scales both dimensions, and the minimum applies to both). */}
      <NodeResizer
        isVisible={selected}
        keepAspectRatio
        minWidth={NODE_MIN_SIZE.width}
        minHeight={NODE_MIN_SIZE.height}
        handleClassName="size-2!"
      />
      {/* One handle per side, all `source`: with `ConnectionMode.Loose` (set on the canvas) any
          handle connects to any other, so a node can be wired to any side of any node. The
          handle id is its side, which the edge keeps as `sourceHandle` / `targetHandle`. Their
          colors come from the `.react-flow` rule in `globals.css`. */}
      {HANDLE_SIDES.map((side) => (
        <Handle
          key={side}
          id={side}
          type="source"
          position={side}
          className="size-2.5! opacity-0 transition-opacity group-hover:opacity-100"
        />
      ))}
    </div>
  );
}

export const CanvasNodeRenderer = memo(CanvasNodeView);
