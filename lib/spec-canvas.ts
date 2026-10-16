import type { SpecEdge, SpecNode } from "@/lib/spec-input";
import { isNodeShape } from "@/types/canvas";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// The graph in the shape `POST /api/ai/spec` takes, read from a snapshot of the room's Storage
// (`root.toJSON()`): the canvas is the `flow` key, with `nodes` and `edges` as objects keyed
// by ID (`@liveblocks/react-flow`). Only what a spec needs is kept, as the server does again: a
// node's ID, label and shape (an unknown shape draws as a rectangle on the canvas, so it counts as
// one here), an edge's ID, ends and text. Anything that is not the expected shape is skipped, since
// Storage outlives the code that wrote it; an edge to a node that is not there is skipped too.
export function readSpecCanvas(storage: unknown): { nodes: SpecNode[]; edges: SpecEdge[] } {
  const flow = isRecord(storage) ? storage.flow : undefined;
  const rawNodes = isRecord(flow) && isRecord(flow.nodes) ? Object.values(flow.nodes) : [];
  const rawEdges = isRecord(flow) && isRecord(flow.edges) ? Object.values(flow.edges) : [];

  const nodes: SpecNode[] = [];
  for (const node of rawNodes) {
    if (!isRecord(node) || typeof node.id !== "string" || node.id === "") continue;

    const data = isRecord(node.data) ? node.data : {};
    nodes.push({
      id: node.id,
      data: {
        label: typeof data.label === "string" ? data.label : "",
        shape: isNodeShape(data.shape) ? data.shape : "rectangle",
      },
    });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: SpecEdge[] = [];
  for (const edge of rawEdges) {
    if (
      !isRecord(edge) ||
      typeof edge.id !== "string" ||
      typeof edge.source !== "string" ||
      typeof edge.target !== "string" ||
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target)
    ) {
      continue;
    }

    edges.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(typeof edge.label === "string" && edge.label.trim() !== "" ? { label: edge.label } : {}),
    });
  }

  return { nodes, edges };
}
