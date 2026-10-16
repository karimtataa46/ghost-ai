import type { MutableFlow } from "@liveblocks/react-flow/node";
import type { JSONSchema7 } from "json-schema";

import {
  NODE_MIN_SIZE,
  NODE_SHAPES,
  SHAPE_DEFAULT_COLORS,
  SHAPE_DEFAULT_SIZES,
  isNodeShape,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
  type ShapeSize,
} from "@/types/canvas";

// What the design agent can do to the canvas. The model proposes a list of these; every one is
// validated here (the model's output is untrusted input) and applied through the Liveblocks flow
// utilities, so the rules in `context/ui-context.md` hold whatever the model says: only the six
// node shapes, the palette's colors, and a tidy grid layout.

export const DESIGN_ACTION_TYPES = [
  "add_node",
  "move_node",
  "resize_node",
  "update_node",
  "delete_node",
  "add_edge",
  "delete_edge",
] as const;

export type DesignActionType = (typeof DESIGN_ACTION_TYPES)[number];

// The sides a node has connection handles on; a handle's id is its side (`canvas-node.tsx`).
type HandleSide = "top" | "right" | "bottom" | "left";

// Positions (`x`, `y`) are the node's CENTER in canvas coordinates; React Flow wants the top-left
// corner, which `applyDesignAction` works out from the node's size.
export type DesignAction =
  | {
      type: "add_node";
      id: string;
      shape: NodeShape;
      label: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
    }
  | { type: "move_node"; id: string; x: number; y: number }
  | { type: "resize_node"; id: string; width: number; height: number }
  | { type: "update_node"; id: string; label?: string; shape?: NodeShape }
  | { type: "delete_node"; id: string }
  | {
      type: "add_edge";
      source: string;
      target: string;
      label?: string;
    }
  | { type: "delete_edge"; id?: string; source?: string; target?: string };

export interface DesignPlan {
  // One sentence about what was designed, shown as the final status line.
  summary: string;
  actions: DesignAction[];
  // How many proposed actions were malformed and dropped.
  dropped: number;
}

// Limits that keep a plan, and what it draws, sane.
export const MAX_ACTIONS = 80;
const MAX_NODE_LABEL_LENGTH = 60;
const MAX_EDGE_LABEL_LENGTH = 40;
const MAX_ID_LENGTH = 64;
const MAX_NODE_SIZE = 400;
const MAX_COORDINATE = 20_000;

// Layout rules: node corners snap to a 20px grid and no two nodes come closer than `NODE_GAP`.
export const GRID_SIZE = 20;
export const NODE_GAP = 60;

// The model's response format. A flat object with optional fields (rather than a union per
// action) because that is what Gemini's structured output handles reliably; which fields an
// action needs is checked in `parseDesignAction`.
export const DESIGN_PLAN_JSON_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "One sentence describing what the design is or what changed.",
    },
    actions: {
      type: "array",
      description: "The canvas changes, in order.",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: [...DESIGN_ACTION_TYPES] },
          id: {
            type: "string",
            description:
              "Node id (letters, numbers, hyphen, underscore). For add_node a new unique id; otherwise the id of an existing or just-added node. For delete_edge, an edge id.",
          },
          shape: { type: "string", enum: [...NODE_SHAPES] },
          label: {
            type: "string",
            description:
              "Text on the item. add_node and update_node: the node's label. add_edge: what the connection does or carries, one to three words, never empty. Every other action: an empty string.",
          },
          x: { type: "number", description: "Node center x in canvas units." },
          y: { type: "number", description: "Node center y in canvas units." },
          width: { type: "number" },
          height: { type: "number" },
          source: { type: "string", description: "Source node id of an edge." },
          target: { type: "string", description: "Target node id of an edge." },
        },
        // `label` is required so the model always writes one: left optional, it never labelled an
        // edge. Actions that have no text send "", which `parseDesignAction` ignores.
        required: ["type", "label"],
      },
    },
  },
  required: ["summary", "actions"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nodeId(value: unknown): string | null {
  return typeof value === "string" && value.length <= MAX_ID_LENGTH && /^[A-Za-z0-9_-]+$/.test(value)
    ? value
    : null;
}

function text(value: unknown, maxLength: number): string | null {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampSize(width: number, height: number): ShapeSize {
  return {
    width: Math.round(clamp(width, NODE_MIN_SIZE.width, MAX_NODE_SIZE)),
    height: Math.round(clamp(height, NODE_MIN_SIZE.height, MAX_NODE_SIZE)),
  };
}

// One proposed action as a valid `DesignAction`, or null when it is malformed or incomplete.
export function parseDesignAction(value: unknown): DesignAction | null {
  if (!isRecord(value)) return null;

  switch (value.type) {
    case "add_node": {
      const id = nodeId(value.id);
      const x = finiteNumber(value.x);
      const y = finiteNumber(value.y);
      const label = text(value.label, MAX_NODE_LABEL_LENGTH);

      if (!id || x === null || y === null || label === null || !isNodeShape(value.shape)) {
        return null;
      }

      const width = finiteNumber(value.width);
      const height = finiteNumber(value.height);

      return {
        type: "add_node",
        id,
        shape: value.shape,
        label,
        x: clamp(x, -MAX_COORDINATE, MAX_COORDINATE),
        y: clamp(y, -MAX_COORDINATE, MAX_COORDINATE),
        ...(width !== null && width > 0 && { width }),
        ...(height !== null && height > 0 && { height }),
      };
    }

    case "move_node": {
      const id = nodeId(value.id);
      const x = finiteNumber(value.x);
      const y = finiteNumber(value.y);

      if (!id || x === null || y === null) return null;

      return {
        type: "move_node",
        id,
        x: clamp(x, -MAX_COORDINATE, MAX_COORDINATE),
        y: clamp(y, -MAX_COORDINATE, MAX_COORDINATE),
      };
    }

    case "resize_node": {
      const id = nodeId(value.id);
      const width = finiteNumber(value.width);
      const height = finiteNumber(value.height);

      if (!id || width === null || height === null || width <= 0 || height <= 0) return null;

      return { type: "resize_node", id, width, height };
    }

    case "update_node": {
      const id = nodeId(value.id);
      // An empty label means "no new label" (the schema makes the model send one), so a change of
      // shape alone does not blank the node's text.
      const label = text(value.label, MAX_NODE_LABEL_LENGTH) || null;
      const shape = isNodeShape(value.shape) ? value.shape : undefined;

      if (!id || (label === null && shape === undefined)) return null;

      return {
        type: "update_node",
        id,
        ...(label !== null && { label }),
        ...(shape !== undefined && { shape }),
      };
    }

    case "delete_node": {
      const id = nodeId(value.id);

      return id ? { type: "delete_node", id } : null;
    }

    case "add_edge": {
      const source = nodeId(value.source);
      const target = nodeId(value.target);

      if (!source || !target || source === target) return null;

      const label = text(value.label, MAX_EDGE_LABEL_LENGTH);

      return {
        type: "add_edge",
        source,
        target,
        ...(label && { label }),
      };
    }

    case "delete_edge": {
      const id = typeof value.id === "string" && value.id ? value.id : undefined;
      const source = nodeId(value.source) ?? undefined;
      const target = nodeId(value.target) ?? undefined;

      if (!id && !(source && target)) return null;

      return {
        type: "delete_edge",
        ...(id && { id }),
        ...(source && { source }),
        ...(target && { target }),
      };
    }

    default:
      return null;
  }
}

// The model's whole answer as a plan, or null when it is not even shaped like one. Malformed
// actions inside it are dropped (and counted) rather than failing the plan, so one bad action
// does not throw away the rest of a good design.
export function parseDesignPlan(value: unknown): DesignPlan | null {
  if (!isRecord(value) || !Array.isArray(value.actions)) return null;

  const proposed = value.actions.slice(0, MAX_ACTIONS);
  const actions: DesignAction[] = [];

  for (const item of proposed) {
    const action = parseDesignAction(item);

    if (action) actions.push(action);
  }

  return {
    summary: text(value.summary, 200) || "Updated the design",
    actions,
    dropped: value.actions.length - actions.length,
  };
}

// The order actions are applied in, so a plan reads the same however the model ordered it:
// removals first, then changes to what exists, then new nodes, then the edges between them
// (an edge needs both of its nodes to exist).
const ACTION_ORDER: Record<DesignActionType, number> = {
  delete_edge: 0,
  delete_node: 1,
  update_node: 2,
  resize_node: 2,
  move_node: 2,
  add_node: 3,
  add_edge: 4,
};

export function orderDesignActions(actions: DesignAction[]): DesignAction[] {
  // `sort` is stable, so actions of one kind keep the model's order.
  return [...actions].sort((a, b) => ACTION_ORDER[a.type] - ACTION_ORDER[b.type]);
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function snap(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function sizeOf(node: CanvasNode): ShapeSize {
  const fallback = isNodeShape(node.data?.shape)
    ? SHAPE_DEFAULT_SIZES[node.data.shape]
    : SHAPE_DEFAULT_SIZES.rectangle;

  return {
    width: node.width && node.width > 0 ? node.width : fallback.width,
    height: node.height && node.height > 0 ? node.height : fallback.height,
  };
}

function rectOf(node: CanvasNode): Rect {
  return { x: node.position.x, y: node.position.y, ...sizeOf(node) };
}

function collides(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width + NODE_GAP &&
    a.x + a.width + NODE_GAP > b.x &&
    a.y < b.y + b.height + NODE_GAP &&
    a.y + a.height + NODE_GAP > b.y
  );
}

// Searches outwards on the grid in rings, so the node ends up as close as possible to where the
// model put it.
const MAX_SEARCH_RINGS = 40;

// Where a node of `size` can go so it keeps `NODE_GAP` from every rect in `others`: the grid-snapped
// top-left corner nearest to `wanted`, or, if the area is full, below everything.
function findFreeSpot(wanted: { x: number; y: number }, size: ShapeSize, others: Rect[]) {
  const origin = { x: snap(wanted.x), y: snap(wanted.y) };

  for (let ring = 0; ring <= MAX_SEARCH_RINGS; ring += 1) {
    for (let dx = -ring; dx <= ring; dx += 1) {
      for (let dy = -ring; dy <= ring; dy += 1) {
        // Only the outline of the ring: everything inside it was tried in an earlier ring.
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;

        const candidate: Rect = {
          x: origin.x + dx * GRID_SIZE,
          y: origin.y + dy * GRID_SIZE,
          ...size,
        };

        if (!others.some((other) => collides(candidate, other))) {
          return { x: candidate.x, y: candidate.y };
        }
      }
    }
  }

  const bottom = Math.max(...others.map((other) => other.y + other.height));

  return { x: origin.x, y: snap(bottom + NODE_GAP) };
}

// Which side of each node an edge leaves and enters: along the longer axis between the two
// nodes, so a left-to-right flow leaves on the right and enters on the left. Always decided here
// rather than by the model, so edges route the same way across designs.
function pickHandles(from: Rect, to: Rect): { source: HandleSide; target: HandleSide } {
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { source: "right", target: "left" } : { source: "left", target: "right" };
  }

  return dy >= 0 ? { source: "bottom", target: "top" } : { source: "top", target: "bottom" };
}

export interface ActionResult {
  applied: boolean;
  // Why nothing happened, when `applied` is false.
  reason?: string;
  // Where the AI's cursor should go: the center of the node the action touched.
  focus?: { x: number; y: number };
  // What happened, in words, when `applied` is true.
  description?: string;
}

function centerOf(rect: Rect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function skipped(reason: string): ActionResult {
  return { applied: false, reason };
}

// Applies one action to the flow. Does nothing, and says why, when the action does not fit the
// canvas as it is now (an unknown node, a taken id), since the model only sees a snapshot.
export function applyDesignAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAction,
): ActionResult {
  switch (action.type) {
    case "add_node": {
      if (flow.getNode(action.id)) return skipped(`a node "${action.id}" already exists`);

      const defaults = SHAPE_DEFAULT_SIZES[action.shape];
      const size = clampSize(action.width ?? defaults.width, action.height ?? defaults.height);
      const spot = findFreeSpot(
        { x: action.x - size.width / 2, y: action.y - size.height / 2 },
        size,
        flow.nodes.map(rectOf),
      );

      flow.addNode({
        id: action.id,
        type: "canvasNode",
        position: spot,
        width: size.width,
        height: size.height,
        // The canvas draws a shape in its shape color (`shapeColors`), so the node's own color is
        // only the palette default for its shape, like a node dropped from the shape panel.
        data: { label: action.label, color: SHAPE_DEFAULT_COLORS[action.shape], shape: action.shape },
      });

      return {
        applied: true,
        focus: centerOf({ ...spot, ...size }),
        description: `Added ${action.label || action.shape}`,
      };
    }

    case "move_node": {
      const node = flow.getNode(action.id);

      if (!node) return skipped(`no node "${action.id}"`);

      const size = sizeOf(node);
      const others = flow.nodes.filter((other) => other.id !== node.id).map(rectOf);
      const spot = findFreeSpot(
        { x: action.x - size.width / 2, y: action.y - size.height / 2 },
        size,
        others,
      );

      flow.updateNode(node.id, { position: spot });

      return {
        applied: true,
        focus: centerOf({ ...spot, ...size }),
        description: `Moved ${node.data.label || node.id}`,
      };
    }

    case "resize_node": {
      const node = flow.getNode(action.id);

      if (!node) return skipped(`no node "${action.id}"`);

      const size = clampSize(action.width, action.height);

      flow.updateNode(node.id, { width: size.width, height: size.height });

      return {
        applied: true,
        focus: centerOf({ ...node.position, ...size }),
        description: `Resized ${node.data.label || node.id}`,
      };
    }

    case "update_node": {
      const node = flow.getNode(action.id);

      if (!node) return skipped(`no node "${action.id}"`);

      flow.updateNodeData(node.id, {
        ...(action.label !== undefined && { label: action.label }),
        ...(action.shape !== undefined && {
          shape: action.shape,
          color: SHAPE_DEFAULT_COLORS[action.shape],
        }),
      });

      return {
        applied: true,
        focus: centerOf(rectOf(node)),
        description: `Updated ${action.label ?? node.data.label ?? node.id}`,
      };
    }

    case "delete_node": {
      const node = flow.getNode(action.id);

      if (!node) return skipped(`no node "${action.id}"`);

      // The edges go with the node, as they do when a person deletes one.
      flow.removeEdges(
        flow.edges
          .filter((edge) => edge.source === node.id || edge.target === node.id)
          .map((edge) => edge.id),
      );
      flow.removeNode(node.id);

      return {
        applied: true,
        focus: centerOf(rectOf(node)),
        description: `Removed ${node.data.label || node.id}`,
      };
    }

    case "add_edge": {
      const source = flow.getNode(action.source);
      const target = flow.getNode(action.target);

      if (!source || !target) {
        return skipped(`an edge needs both "${action.source}" and "${action.target}" to exist`);
      }

      if (flow.edges.some((edge) => edge.source === source.id && edge.target === target.id)) {
        return skipped(`"${source.id}" is already connected to "${target.id}"`);
      }

      // Same id scheme as the starter templates; a taken id (e.g. after an edge between the same
      // nodes was deleted and drawn again by hand) gets a numeric suffix.
      const baseId = `${source.id}-${target.id}`;
      let id = baseId;

      for (let attempt = 2; flow.getEdge(id); attempt += 1) {
        id = `${baseId}-${attempt}`;
      }

      const picked = pickHandles(rectOf(source), rectOf(target));

      flow.addEdge({
        id,
        source: source.id,
        target: target.id,
        sourceHandle: picked.source,
        targetHandle: picked.target,
        ...(action.label && { label: action.label }),
      });

      return {
        applied: true,
        focus: centerOf(rectOf(target)),
        description: `Connected ${source.data.label || source.id} to ${target.data.label || target.id}`,
      };
    }

    case "delete_edge": {
      const edge = action.id
        ? flow.getEdge(action.id)
        : flow.edges.find((e) => e.source === action.source && e.target === action.target);

      if (!edge) return skipped("no such edge");

      flow.removeEdge(edge.id);

      const target = flow.getNode(edge.target);

      return {
        applied: true,
        ...(target && { focus: centerOf(rectOf(target)) }),
        description: "Removed a connection",
      };
    }
  }
}
