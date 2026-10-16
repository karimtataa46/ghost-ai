import type { Rect } from "@xyflow/react";

// How far apart, in canvas units, the points are that an edge's path is sampled at. An edge is
// treated as the line through those points, so a smaller step follows its rounded corners more
// closely and costs more points to test.
const PATH_SAMPLE_STEP = 4;

// True when the line from (x0, y0) to (x1, y1) touches the rectangle, including when it starts or
// ends inside it (Liang-Barsky clipping).
function segmentTouchesRect(x0: number, y0: number, x1: number, y1: number, rect: Rect) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  // Each pair is [how fast the line moves toward this side, how far the start is from it].
  const sides: [number, number][] = [
    [-dx, x0 - rect.x],
    [dx, rect.x + rect.width - x0],
    [-dy, y0 - rect.y],
    [dy, rect.y + rect.height - y0],
  ];
  let enter = 0;
  let exit = 1;

  for (const [speed, distance] of sides) {
    if (speed === 0) {
      // Parallel to this side: it either runs outside it the whole way or never leaves it.
      if (distance < 0) return false;
      continue;
    }

    const t = distance / speed;

    if (speed < 0) {
      if (t > exit) return false;
      if (t > enter) enter = t;
    } else {
      if (t < enter) return false;
      if (t < exit) exit = t;
    }
  }

  return true;
}

// True when the SVG path passes through the rectangle (both in canvas coordinates, which is what
// an edge's path is drawn in).
function pathTouchesRect(path: SVGPathElement, rect: Rect) {
  const length = path.getTotalLength();
  let previous = path.getPointAtLength(0);

  for (let distance = PATH_SAMPLE_STEP; ; distance += PATH_SAMPLE_STEP) {
    const point = path.getPointAtLength(Math.min(distance, length));

    if (segmentTouchesRect(previous.x, previous.y, point.x, point.y, rect)) return true;
    if (distance >= length) return false;

    previous = point;
  }
}

// The IDs of the edges whose line passes through `rect` (in canvas coordinates), read from the
// edges React Flow has drawn under `root`. React Flow's own selection box only picks the edges
// connected to the nodes it touches, so an edge that runs through the box between nodes the box
// does not touch is found here instead.
export function getEdgeIdsCrossingRect(root: HTMLElement, rect: Rect) {
  const ids: string[] = [];

  for (const edge of root.querySelectorAll<SVGGElement>(".react-flow__edge")) {
    const id = edge.dataset.id;
    const path = edge.querySelector<SVGPathElement>(".react-flow__edge-path");

    if (id && path && pathTouchesRect(path, rect)) ids.push(id);
  }

  return ids;
}
