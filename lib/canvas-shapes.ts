import type { NodeShape } from "@/types/canvas";

// The shapes drawn as SVG. Rectangle, pill, and circle are plain CSS boxes with a radius.
export type SvgNodeShape = Extract<NodeShape, "diamond" | "hexagon" | "cylinder">;

export function isSvgNodeShape(shape: NodeShape): shape is SvgNodeShape {
  return shape === "diamond" || shape === "hexagon" || shape === "cylinder";
}

export interface ShapePaths {
  // Filled and outlined.
  body: string;
  // An extra outline-only line, for detail drawn inside the body (the cylinder's front lip).
  detail?: string;
}

// The outline is 1px wide and centered on the path, so the path is pulled in by half of it to
// keep the whole stroke inside the node, like a CSS border.
const STROKE_INSET = 0.5;

// Path data for a shape that fills a `width` x `height` box, in that box's own pixels. The
// numbers come from the node's real size, so the shape (and its corners) follow the node as it
// grows or shrinks while the outline stays 1px.
export function getShapePaths(shape: SvgNodeShape, width: number, height: number): ShapePaths {
  const left = STROKE_INSET;
  const right = width - STROKE_INSET;
  const top = STROKE_INSET;
  const bottom = height - STROKE_INSET;
  const centerX = width / 2;
  const centerY = height / 2;

  switch (shape) {
    case "diamond":
      return {
        body: `M ${centerX} ${top} L ${right} ${centerY} L ${centerX} ${bottom} L ${left} ${centerY} Z`,
      };

    case "hexagon": {
      // Flat top and bottom, points left and right; each slanted side spans a quarter of the width.
      const slant = width * 0.25;
      return {
        body: `M ${slant} ${top} L ${width - slant} ${top} L ${right} ${centerY} L ${width - slant} ${bottom} L ${slant} ${bottom} L ${left} ${centerY} Z`,
      };
    }

    case "cylinder": {
      // The top and bottom are half-ellipses with the same radii; the top ellipse's front edge
      // is drawn again as the lip.
      const radiusX = (right - left) / 2;
      const radiusY = Math.min(height * 0.15, radiusX);
      const lipY = top + radiusY;
      const baseY = bottom - radiusY;
      return {
        body: `M ${left} ${lipY} A ${radiusX} ${radiusY} 0 0 1 ${right} ${lipY} L ${right} ${baseY} A ${radiusX} ${radiusY} 0 0 1 ${left} ${baseY} Z`,
        detail: `M ${left} ${lipY} A ${radiusX} ${radiusY} 0 0 0 ${right} ${lipY}`,
      };
    }
  }
}
