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

// Node fill and its text color, tuned for the dark canvas (`context/ui-context.md`, Node
// Color Palette). A node's `data.color` holds one of the `fill` values.
export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" }, // neutral dark (default)
  { fill: "#10233D", text: "#52A8FF" }, // blue
  { fill: "#2E1938", text: "#BF7AF0" }, // purple
  { fill: "#331B00", text: "#FF990A" }, // orange
  { fill: "#3C1618", text: "#FF6166" }, // red
  { fill: "#3A1726", text: "#F75F8F" }, // pink
  { fill: "#0F2E18", text: "#62C073" }, // green
  { fill: "#062822", text: "#0AC7B4" }, // teal
] as const;

export const DEFAULT_NODE_COLOR = NODE_COLORS[0];

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

// What the shape panel puts on a drag, and the canvas reads back on drop.
export interface ShapeDragPayload extends ShapeSize {
  shape: NodeShape;
}

// A `type`, not an `interface`: React Flow requires node data to be assignable to
// `Record<string, unknown>`, which an interface (no implicit index signature) is not.
export type CanvasNodeData = {
  label: string;
  // Fill color, one of `NODE_COLORS[number]["fill"]`; the text color is looked up from it.
  color: string;
  shape: NodeShape;
};

// The canvas's custom node and edge. `canvasNode` is registered with React Flow in
// `components/editor/canvas.tsx`; the `canvasEdge` renderer comes later.
export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">;
