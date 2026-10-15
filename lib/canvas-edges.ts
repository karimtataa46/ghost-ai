import { MarkerType, type DefaultEdgeOptions } from "@xyflow/react";

import { EDGE_COLOR } from "@/types/canvas";

// How every edge looks (`context/ui-context.md`, Edge Style): a thin smooth-step line with an
// arrow at the end. React Flow merges these into each edge when it draws it, so they are not
// stored in the room: the edge a connection creates holds only its source and target (and
// handles), and every client styles it the same way.
export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
};
