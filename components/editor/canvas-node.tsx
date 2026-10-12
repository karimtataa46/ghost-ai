"use client";

import type { NodeProps } from "@xyflow/react";
import { memo } from "react";

import { cn } from "@/lib/utils";
import { DEFAULT_NODE_COLOR, NODE_COLORS, type CanvasNode } from "@/types/canvas";

// The text color paired with a node fill in the palette; unknown fills use the default's.
function getNodeTextColor(fill: string): string {
  return NODE_COLORS.find((color) => color.fill === fill)?.text ?? DEFAULT_NODE_COLOR.text;
}

// Basic renderer for `canvasNode`: every shape is a bordered rectangle with its label
// centered. Shape-specific visuals come later. It fills the node's width and height, which
// the shape panel sets from the shape's default size.
function CanvasNodeView({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-xl border border-surface-border-subtle px-3 text-center text-sm wrap-anywhere",
        selected && "border-brand",
      )}
      style={{ backgroundColor: data.color, color: getNodeTextColor(data.color) }}
    >
      {data.label}
    </div>
  );
}

export const CanvasNodeRenderer = memo(CanvasNodeView);
