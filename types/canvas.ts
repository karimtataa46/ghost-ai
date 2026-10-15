import type { Edge, Node } from "@xyflow/react";

// The shapes a node can take (`context/ui-context.md`, Node Shapes).
export const NODE_SHAPES = [
  "rectangle", // default general-purpose node
  "diamond", // decision / gateway
  "circle", // event / endpoint
  "pill", // service / process
  "cylinder", // database / storage
  "hexagon", // external system / boundary
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

export function isNodeShape(value: unknown): value is NodeShape {
  return NODE_SHAPES.some((shape) => shape === value);
}

// Node fill and its text color, tuned for the dark canvas (`context/ui-context.md`, Node
// Color Palette). A shape's color is one of the `fill` values (`ShapeColors`); the text color is
// looked up from it. `name` labels the pair in the shape color toolbar
// (`components/editor/shape-color-toolbar.tsx`).
export const NODE_COLORS = [
  { name: "Neutral", fill: "#1F1F1F", text: "#EDEDED" }, // neutral dark (default)
  { name: "Blue", fill: "#10233D", text: "#52A8FF" },
  { name: "Purple", fill: "#2E1938", text: "#BF7AF0" },
  { name: "Orange", fill: "#331B00", text: "#FF990A" },
  { name: "Red", fill: "#3C1618", text: "#FF6166" },
  { name: "Pink", fill: "#3A1726", text: "#F75F8F" },
  { name: "Green", fill: "#0F2E18", text: "#62C073" },
  { name: "Teal", fill: "#062822", text: "#0AC7B4" },
] as const;

export const DEFAULT_NODE_COLOR = NODE_COLORS[0];

export type NodeFill = (typeof NODE_COLORS)[number]["fill"];

export function isNodeFill(value: unknown): value is NodeFill {
  return NODE_COLORS.some((color) => color.fill === value);
}

// The color every node of a shape has until someone picks another one in the shape panel, so a
// diagram reads at a glance. Each is a palette fill (the type keeps it that way) picked to match
// what the shape stands for in `NODE_SHAPES`. Red is left out: it reads as an error.
// `DEFAULT_NODE_COLOR` stays the fallback for a text color that is not in the palette.
export const SHAPE_DEFAULT_COLORS: Record<NodeShape, NodeFill> = {
  rectangle: "#10233D", // blue: general-purpose
  diamond: "#331B00", // orange: decision / gateway
  circle: "#0F2E18", // green: event / endpoint
  pill: "#2E1938", // purple: service / process
  cylinder: "#062822", // teal: database / storage
  hexagon: "#3A1726", // pink: external system / boundary
};

// Default edge color (`context/ui-context.md`, Edge Style), used for the line and its arrow.
export const EDGE_COLOR = "#f8fafc";

export interface ShapeSize {
  width: number;
  height: number;
}

// Size a shape gets when it is dropped on the canvas, in canvas units. Rectangles are wider
// than tall, circles are square, and diamonds are larger so their label has room.
export const SHAPE_DEFAULT_SIZES: Record<NodeShape, ShapeSize> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 180, height: 120 },
  circle: { width: 96, height: 96 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 140, height: 100 },
};

// The smallest a node can be resized to, in canvas units. Resizing keeps a node's aspect ratio,
// so this is a floor on both sides rather than a fixed minimum shape: a 2:1 node stops at 96 x 48.
// Below the smallest default size (the pill's 64px height) so every shape can shrink a little,
// but large enough that the SVG shapes keep their proportions and a label stays readable.
export const NODE_MIN_SIZE: ShapeSize = { width: 64, height: 48 };

// Shown, dimmed, in a node whose label is empty, and in the label editor while it is empty, so
// people can see that a node takes text and where it goes.
export const NODE_LABEL_PLACEHOLDER = "Label";

// Shown, dimmed, in an edge's text editor while it is empty. An edge with no text draws nothing,
// so there is no placeholder outside the editor.
export const EDGE_LABEL_PLACEHOLDER = "Label";

// The color picked for each shape in the shape panel, kept in the room's Storage
// (`liveblocks.config.ts`, `shapeColors`) so every collaborator sees it. A shape with no entry
// uses `SHAPE_DEFAULT_COLORS`. Values are palette fills, but Storage outlives this code, so they
// are checked with `isNodeFill` on read. A `type`, not an `interface`: Liveblocks needs it to be
// assignable to `LsonObject`.
export type ShapeColors = Partial<Record<NodeShape, string>>;

// What dragging on empty canvas does: `pan` moves the view, `select` draws a selection box.
// Chosen in the control bar; UI state only, never synced (`lib/canvas-tools.ts`).
export type CanvasTool = "select" | "pan";

// What the shape panel puts on a drag, and the canvas reads back on drop.
export interface ShapeDragPayload extends ShapeSize {
  shape: NodeShape;
}

// A `type`, not an `interface`: React Flow requires node data to be assignable to
// `Record<string, unknown>`, which an interface (no implicit index signature) is not.
export type CanvasNodeData = {
  label: string;
  // The fill the node was created with. It is not what the node draws: every node of a shape
  // shares the shape's color (`ShapeColors`), so changing it in the shape panel recolors them all.
  color: string;
  shape: NodeShape;
};

// The canvas's custom node and edge. `canvasNode` is registered with React Flow in
// `components/editor/canvas.tsx`. Edges are drawn by `CanvasEdgeRenderer`, registered there under
// React Flow's `smoothstep` type (`CANVAS_EDGE_TYPE`), not under `canvasEdge`: edges are stored
// with `smoothstep` (or no type), so `CanvasEdge`'s `canvasEdge` is the type of a custom edge that
// does not exist yet.
export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">;

// What is saved for a canvas: the JSON stored in Vercel Blob (`lib/canvas-storage.ts`) and sent
// between the editor and `/api/projects/[projectId]/canvas`. Only the fields that define the
// diagram; local-only React Flow state (selection, measured size) is never part of it
// (`lib/canvas-snapshot.ts`).
export interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// Where autosave is: `idle` until the first save of this session, then `saving`, `saved`, or
// `error` (shown in the navbar's Save button).
export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";
