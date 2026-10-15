"use client";

import { useStore, type ReactFlowState } from "@xyflow/react";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { CanvasShape } from "@/components/editor/canvas-shape";
import { useShapeColors } from "@/components/editor/shape-colors-provider";
import type { ShapeDragPayload } from "@/types/canvas";

interface ShapeDragPreviewProps {
  // The payload the drag carries, so the ghost is the shape and size that will be dropped.
  payload: ShapeDragPayload;
  // Where the cursor was when the drag started, in viewport coordinates.
  x: number;
  y: number;
}

const selectZoom = (state: ReactFlowState) => state.transform[2];

// A ghost of the shape being dragged from the shape panel. Its top-left corner follows the
// cursor, which is where the node's top-left corner lands on drop, and it is drawn at the
// on-screen size the node will have at the canvas's current zoom. The parent mounts it for the
// length of a drag, so it disappears on drop or cancel. Needs a `ReactFlowProvider` above it
// (for the zoom).
export function ShapeDragPreview({ payload, x, y }: ShapeDragPreviewProps) {
  const zoom = useStore(selectZoom);
  const { getColor } = useShapeColors();
  const ref = useRef<HTMLDivElement>(null);

  // The position is written straight to the element, not through state: it changes with every
  // pointer move, and re-rendering for each one is wasted work.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    function moveTo(clientX: number, clientY: number) {
      if (element) element.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
    }

    moveTo(x, y);
    // `dragover` fires on whatever is under the cursor for the whole drag in every browser
    // (`drag` reports 0, 0 in Firefox), and the cursor leaving the canvas does not stop it.
    function onDragOver(event: DragEvent) {
      moveTo(event.clientX, event.clientY);
    }
    document.addEventListener("dragover", onDragOver);

    return () => document.removeEventListener("dragover", onDragOver);
  }, [x, y]);

  // A portal to `body`: the shape panel's backdrop blur and transform would otherwise become
  // the containing block of this fixed element and offset it. `pointer-events-none` keeps the
  // ghost from being the drop target, so the canvas still receives `dragover` and `drop`.
  return createPortal(
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-50 will-change-transform"
    >
      <div className="origin-top-left opacity-60" style={{ transform: `scale(${zoom})` }}>
        <CanvasShape
          shape={payload.shape}
          color={getColor(payload.shape)}
          label=""
          width={payload.width}
          height={payload.height}
        />
      </div>
    </div>,
    document.body,
  );
}
