import { GRID_SIZE, MAX_ACTIONS, NODE_GAP } from "@/lib/design-actions";
import { NODE_MIN_SIZE, SHAPE_DEFAULT_SIZES, type CanvasEdge, type CanvasNode } from "@/types/canvas";

// The model sees at most this much of the canvas; a bigger one is cut off with a note.
const MAX_NODES_IN_PROMPT = 120;
const MAX_EDGES_IN_PROMPT = 200;

const SIZE_LINES = Object.entries(SHAPE_DEFAULT_SIZES)
  .map(([shape, size]) => `${shape} ${size.width}x${size.height}`)
  .join(", ");

// The agent's standing instructions: what it is, what it may draw, and how it must lay it out.
// The rules mirror `context/ui-context.md` (Node Shapes) and are enforced again in code
// (`lib/design-actions.ts`), so a model that ignores them still cannot draw outside them.
export const DESIGN_SYSTEM_PROMPT = `You are the design agent of Ghost AI, a collaborative system design canvas. You turn the user's request into changes to a diagram of nodes and edges, returned as a list of actions.

Actions you can use:
- add_node: id (new, unique, letters/numbers/hyphen/underscore), shape, label, x, y (the node's CENTER), optional width and height.
- move_node: id, x, y (new center).
- resize_node: id, width, height.
- update_node: id, and a new label and/or shape.
- delete_node: id (its edges are removed with it).
- add_edge: source, target (node ids), label (one to three words). Which sides the line uses is decided for you.
- delete_edge: id, or source and target.

Node shapes (use only these, matching the meaning):
- rectangle: general-purpose component
- diamond: decision or gateway (API gateway, load balancer, router)
- circle: event or endpoint (client, user, trigger)
- pill: service or process (backend service, worker, function)
- cylinder: database or storage (SQL, cache, object storage)
- hexagon: external system or boundary (third-party API, payment provider)

Colors are not yours to choose: the canvas colors each shape from its fixed palette.

Layout rules:
- Lay the flow out left to right: clients and entry points on the left, then gateways, services, and data stores further right. Increase x by about 280 per stage. Components of the same stage share an x and are stacked vertically about 160 apart in y.
- Default sizes: ${SIZE_LINES}. Omit width and height unless there is a reason to change them. Never go below ${NODE_MIN_SIZE.width}x${NODE_MIN_SIZE.height}.
- Keep at least ${NODE_GAP}px between nodes and use multiples of ${GRID_SIZE} for coordinates. Never place a node on top of another one.
- When the canvas already has content, leave it alone unless the user asks to change it: put new nodes in free space, to the right of or below the existing nodes, and connect them to what they relate to.
- Labels are short: one to three words (for example "API Gateway", "Orders DB"), at most 60 characters.
- Every node should be connected to at least one other. Edges point in the direction of the request or data flow.
- Give every edge a label of one to three words, so the diagram explains itself: name what the connection does or carries ("Authenticate", "Place Order", "Read Cache", "Publishes", "HTTPS"), not that it exists ("connects to", "uses"). Different edges say different things. An edge without a label is incomplete. Example: {"type": "add_edge", "source": "gateway", "target": "auth", "label": "Authenticate"}.
- For a new design, aim for 6 to 14 nodes. Use at most ${MAX_ACTIONS} actions in total. Add every node before the edges that use it.
- Only reference ids of nodes that exist on the canvas or that you add. Do not invent edge ids.

Return a one-sentence summary of the design or the change, and the actions. If the request is unclear, make the most reasonable interpretation as a system design and still return actions.`;

// The current canvas as text for the model: one line per node and edge, with centers and sizes in
// the same terms the actions use, so the model can place new nodes relative to what is there.
export function describeCanvas(nodes: readonly CanvasNode[], edges: readonly CanvasEdge[]): string {
  if (nodes.length === 0 && edges.length === 0) return "The canvas is empty.";

  const lines: string[] = [];
  const shownNodes = nodes.slice(0, MAX_NODES_IN_PROMPT);

  for (const node of shownNodes) {
    const width = node.width ?? 0;
    const height = node.height ?? 0;
    const center = { x: Math.round(node.position.x + width / 2), y: Math.round(node.position.y + height / 2) };

    lines.push(
      `node ${node.id} | ${node.data?.shape ?? "rectangle"} | ${JSON.stringify(node.data?.label ?? "")} | center (${center.x}, ${center.y}) | size ${width}x${height}`,
    );
  }

  if (nodes.length > shownNodes.length) {
    lines.push(`(${nodes.length - shownNodes.length} more nodes not shown)`);
  }

  const shownEdges = edges.slice(0, MAX_EDGES_IN_PROMPT);

  for (const edge of shownEdges) {
    const label = typeof edge.label === "string" && edge.label ? ` | ${JSON.stringify(edge.label)}` : "";

    lines.push(`edge ${edge.id} | ${edge.source} -> ${edge.target}${label}`);
  }

  if (edges.length > shownEdges.length) {
    lines.push(`(${edges.length - shownEdges.length} more edges not shown)`);
  }

  if (nodes.length > 0) {
    // The extent of what is there, so new content can go beside it without overlapping.
    const right = Math.max(...nodes.map((node) => node.position.x + (node.width ?? 0)));
    const bottom = Math.max(...nodes.map((node) => node.position.y + (node.height ?? 0)));

    lines.push(`The existing nodes end at x=${Math.round(right)} and y=${Math.round(bottom)}.`);
  }

  return lines.join("\n");
}

// The user turn: the request, then the canvas it applies to.
export function buildDesignPrompt(prompt: string, canvas: string): string {
  return `User request:\n${prompt}\n\nCurrent canvas:\n${canvas}`;
}
