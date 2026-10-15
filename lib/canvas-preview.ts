import {
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";

// The fixed box a diagram preview is drawn in, in its own units. `padding` is kept clear on
// every side.
export interface PreviewViewport {
  width: number;
  height: number;
  padding: number;
}

// A node placed in the preview viewport, already scaled.
export interface PreviewNode {
  id: string;
  shape: NodeShape;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// A line between two node centers in the preview viewport.
export interface PreviewEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PreviewLayout {
  // How much smaller the preview is than the canvas, so a size that is fixed on the canvas
  // (a corner radius) can follow it.
  scale: number;
  nodes: PreviewNode[];
  edges: PreviewEdge[];
}

// Fits a diagram into `viewport`: the bounds are taken from the nodes' positions and sizes, then
// the whole diagram is scaled down (or up) to the largest size that fits inside the padding and
// centered. Plain geometry, so a preview needs no React Flow instance. A node without a size
// uses its shape's default, the same fallback the canvas applies; an edge whose end is not among
// the nodes is dropped.
export function getPreviewLayout(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  viewport: PreviewViewport,
): PreviewLayout {
  if (nodes.length === 0) return { scale: 1, nodes: [], edges: [] };

  const sized = nodes.map((node) => {
    const fallback = SHAPE_DEFAULT_SIZES[node.data.shape];
    return {
      node,
      width: node.width || fallback.width,
      height: node.height || fallback.height,
    };
  });

  const left = Math.min(...sized.map(({ node }) => node.position.x));
  const top = Math.min(...sized.map(({ node }) => node.position.y));
  const right = Math.max(...sized.map(({ node, width }) => node.position.x + width));
  const bottom = Math.max(...sized.map(({ node, height }) => node.position.y + height));

  const boundsWidth = right - left;
  const boundsHeight = bottom - top;
  const scale = Math.min(
    (viewport.width - viewport.padding * 2) / boundsWidth,
    (viewport.height - viewport.padding * 2) / boundsHeight,
  );
  // Whatever the scale leaves over on the shorter axis is split evenly.
  const offsetX = (viewport.width - boundsWidth * scale) / 2;
  const offsetY = (viewport.height - boundsHeight * scale) / 2;

  const placed = sized.map(({ node, width, height }) => ({
    id: node.id,
    shape: node.data.shape,
    color: node.data.color,
    x: offsetX + (node.position.x - left) * scale,
    y: offsetY + (node.position.y - top) * scale,
    width: width * scale,
    height: height * scale,
  }));

  const byId = new Map(placed.map((node) => [node.id, node]));
  const lines: PreviewEdge[] = [];
  for (const edge of edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;

    lines.push({
      id: edge.id,
      x1: source.x + source.width / 2,
      y1: source.y + source.height / 2,
      x2: target.x + target.width / 2,
      y2: target.y + target.height / 2,
    });
  }

  return { scale, nodes: placed, edges: lines };
}
