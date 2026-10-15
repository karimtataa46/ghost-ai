import {
  isNodeShape,
  type CanvasEdge,
  type CanvasNode,
  type CanvasSnapshot,
} from "@/types/canvas";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

// A node's saved form, or null when `value` is not one. Fields are picked by name, in a fixed
// order, so what is saved never includes React Flow's local state (`selected`, `dragging`,
// `measured`, `resizing`) and the same canvas always serializes to the same string.
function parseNode(value: unknown): CanvasNode | null {
  if (!isRecord(value)) return null;

  const { id, type, position, width, height, data } = value;

  if (!isNonEmptyString(id) || type !== "canvasNode") return null;
  if (!isRecord(position) || !isFiniteNumber(position.x) || !isFiniteNumber(position.y)) return null;
  if (width !== undefined && !isPositiveNumber(width)) return null;
  if (height !== undefined && !isPositiveNumber(height)) return null;
  if (
    !isRecord(data) ||
    typeof data.label !== "string" ||
    typeof data.color !== "string" ||
    !isNodeShape(data.shape)
  ) {
    return null;
  }

  return {
    id,
    type,
    position: { x: position.x, y: position.y },
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    data: { label: data.label, color: data.color, shape: data.shape },
  };
}

// A handle ID is a string, or absent (`null` / `undefined`) for the default handle.
function isHandleId(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

// An edge's saved form, or null when `value` is not one. Only what defines the connection is
// kept: its ID, ends, and handles, and its text when it has any (a `label` that is not a
// non-empty string is ignored, like any other stray field). The look is not saved, and anything
// else on the edge is ignored rather than refused. That matters: React Flow merges `defaultEdgeOptions` into a
// connection before `onConnect`, so an edge drawn by hand is stored in the room with
// `type: "smoothstep"`, `markerEnd`, and `style` as well (a template's edges are not). Refusing
// those would make a canvas with one hand-drawn edge impossible to save. Dropping them changes
// nothing on screen, because React Flow merges the same defaults into every edge when it draws
// it (`lib/canvas-edges.ts`). A `canvasEdge` type (the custom edge, not built yet) is kept.
function parseEdge(value: unknown): CanvasEdge | null {
  if (!isRecord(value)) return null;

  const { id, type, source, target, sourceHandle, targetHandle, label } = value;

  if (!isNonEmptyString(id) || !isNonEmptyString(source) || !isNonEmptyString(target)) return null;
  if (!isHandleId(sourceHandle) || !isHandleId(targetHandle)) return null;

  return {
    id,
    ...(type === "canvasEdge" && { type }),
    source,
    target,
    ...(typeof sourceHandle === "string" && { sourceHandle }),
    ...(typeof targetHandle === "string" && { targetHandle }),
    ...(isNonEmptyString(label) && { label }),
  };
}

// Checks unknown data (a request body, a stored blob, or the live canvas) and returns it as a
// clean snapshot, or null when anything in it is not a valid node or edge. Everything that is
// saved or loaded goes through this, because the stored JSON outlives the code that wrote it and
// a request body can be anything. Pass the live React Flow state as `{ nodes, edges }` to get
// the form that is saved.
export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return null;
  }

  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  for (const item of value.nodes) {
    const node = parseNode(item);

    if (!node) return null;
    nodes.push(node);
  }

  for (const item of value.edges) {
    const edge = parseEdge(item);

    if (!edge) return null;
    edges.push(edge);
  }

  return { nodes, edges };
}
