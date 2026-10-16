import { MarkerType, type DefaultEdgeOptions } from "@xyflow/react";
import type { CSSProperties } from "react";

import { EDGE_COLOR } from "@/types/canvas";

// The React Flow edge type every edge draws as. It is React Flow's built-in smooth-step type, and
// `components/editor/canvas.tsx` registers `CanvasEdgeRenderer` under this name, which replaces
// the built-in component. An edge drawn by hand is stored with this type and a template's edge is
// not (`defaultEdgeOptions` supplies it when it is drawn), so one registration covers both.
export const CANVAS_EDGE_TYPE = "smoothstep";

// How every edge looks (`context/ui-context.md`, Edge Style): a thin smooth-step line with an
// arrow at the end. React Flow merges these into each edge when it draws it, so every client
// styles an edge the same way and an edge only needs its source, target, and handles. (An edge
// drawn by hand is also stored with these values, because React Flow merges them into the
// connection before `onConnect`; the saved canvas ignores them, see `lib/canvas-snapshot.ts`.)
export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
};

// What a selected edge draws over its own style: the brand color, a little thicker. It has to be
// applied by the renderer because an edge's stroke is an inline style, which beats the color React
// Flow's stylesheet gives a selected edge. The arrow keeps its color (React Flow bakes it into the
// marker), so the renderer adds a glow in the same brand color to tie the two together.
export const SELECTED_EDGE_STYLE: CSSProperties = {
  stroke: "var(--accent-primary)",
  strokeWidth: 2.5,
  filter: "drop-shadow(0 0 3px var(--accent-primary))",
};
