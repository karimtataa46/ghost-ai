import {
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  type NodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

// Custom MIME type, so the canvas only reacts to drags that come from the shape panel (not
// files, text, or links dragged in from elsewhere).
export const SHAPE_DRAG_TYPE = "application/x-ghost-shape";

export function createShapeDragPayload(shape: NodeShape): ShapeDragPayload {
  return { shape, ...SHAPE_DEFAULT_SIZES[shape] };
}

export function writeShapeDragPayload(dataTransfer: DataTransfer, payload: ShapeDragPayload) {
  dataTransfer.setData(SHAPE_DRAG_TYPE, JSON.stringify(payload));
  dataTransfer.effectAllowed = "copy";
}

// The data itself is hidden until drop, but the types are readable during the drag.
export function isShapeDrag(dataTransfer: DataTransfer): boolean {
  return dataTransfer.types.includes(SHAPE_DRAG_TYPE);
}

function isNodeShape(value: unknown): value is NodeShape {
  return NODE_SHAPES.some((shape) => shape === value);
}

function isSize(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

// Drop data comes from outside the app's types, so check it before a node is built from it.
export function readShapeDragPayload(dataTransfer: DataTransfer): ShapeDragPayload | null {
  const raw = dataTransfer.getData(SHAPE_DRAG_TYPE);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const { shape, width, height } = parsed as Record<string, unknown>;
  if (!isNodeShape(shape) || !isSize(width) || !isSize(height)) return null;

  return { shape, width, height };
}
