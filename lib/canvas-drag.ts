import {
  SHAPE_DEFAULT_SIZES,
  isNodeShape,
  type NodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

// Custom MIME type, so the canvas only reacts to drags that come from the shape panel (not
// files, text, or links dragged in from elsewhere).
export const SHAPE_DRAG_TYPE = "application/x-ghost-shape";

// A 1x1 transparent GIF, created when the module loads so it has finished loading long before
// a drag starts (`setDragImage` ignores an image that is not loaded yet). `Image` does not
// exist during server rendering.
const BLANK_DRAG_IMAGE =
  typeof Image === "undefined"
    ? null
    : Object.assign(new Image(), {
        src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      });

export function createShapeDragPayload(shape: NodeShape): ShapeDragPayload {
  return { shape, ...SHAPE_DEFAULT_SIZES[shape] };
}

export function writeShapeDragPayload(dataTransfer: DataTransfer, payload: ShapeDragPayload) {
  dataTransfer.setData(SHAPE_DRAG_TYPE, JSON.stringify(payload));
  dataTransfer.effectAllowed = "copy";
}

// Replaces the browser's own drag image with nothing, so the shape drag preview is the only
// ghost on screen (it follows the cursor and scales with the canvas zoom, which a native
// drag image cannot do).
export function hideNativeDragImage(dataTransfer: DataTransfer) {
  if (BLANK_DRAG_IMAGE) dataTransfer.setDragImage(BLANK_DRAG_IMAGE, 0, 0);
}

// The data itself is hidden until drop, but the types are readable during the drag.
export function isShapeDrag(dataTransfer: DataTransfer): boolean {
  return dataTransfer.types.includes(SHAPE_DRAG_TYPE);
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
