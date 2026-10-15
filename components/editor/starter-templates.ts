import {
  SHAPE_DEFAULT_COLORS,
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
  type ShapeSize,
} from "@/types/canvas";

// A ready-made diagram a user can start a canvas from. It is plain canvas content (the same
// node and edge schema as anything drawn by hand), so importing one is just adding its nodes and
// edges to the room. Templates live in code and need no database record.
export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// The sides a node has connection handles on; a handle's id is its side (`canvas-node.tsx`).
type HandleSide = "top" | "right" | "bottom" | "left";

// A node centered on (x, y), at its shape's default size unless given another one. Templates are
// laid out by center so rows and columns line up by sharing a number; React Flow wants the
// top-left corner, which is worked out here. `data.color` is the shape's default color, which is
// what the canvas draws until someone picks another color for that shape.
function node(
  id: string,
  shape: NodeShape,
  label: string,
  x: number,
  y: number,
  size: ShapeSize = SHAPE_DEFAULT_SIZES[shape],
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x: x - size.width / 2, y: y - size.height / 2 },
    width: size.width,
    height: size.height,
    data: { label, color: SHAPE_DEFAULT_COLORS[shape], shape },
  };
}

// An edge between two nodes of the same template, leaving one handle and entering another (left
// to right unless told otherwise). Like an edge drawn by hand it stores only its ends and
// handles; the smooth-step line and arrow come from the canvas's default edge options.
function edge(
  source: string,
  target: string,
  sourceHandle: HandleSide = "right",
  targetHandle: HandleSide = "left",
): CanvasEdge {
  return { id: `${source}-${target}`, source, target, sourceHandle, targetHandle };
}

const MICROSERVICES: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "An API gateway routes client requests to independent services, each with its own data store.",
  nodes: [
    node("client", "circle", "Client", 0, 200),
    node("gateway", "diamond", "API Gateway", 230, 200),
    node("auth", "pill", "Auth Service", 510, 40),
    node("orders", "pill", "Orders Service", 510, 200),
    node("payments", "pill", "Payments Service", 510, 360),
    node("users-db", "cylinder", "Users DB", 790, 40),
    node("orders-db", "cylinder", "Orders DB", 790, 200),
    node("payment-provider", "hexagon", "Payment Provider", 790, 360),
  ],
  edges: [
    edge("client", "gateway"),
    edge("gateway", "auth"),
    edge("gateway", "orders"),
    edge("gateway", "payments"),
    edge("auth", "users-db"),
    edge("orders", "orders-db"),
    edge("orders", "payments", "bottom", "top"),
    edge("payments", "payment-provider"),
  ],
};

const CI_CD_PIPELINE: CanvasTemplate = {
  id: "ci-cd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "Build and test every commit, then alert the team on a failure or ship through staging to production.",
  nodes: [
    node("push", "circle", "Git Push", 0, 100),
    node("build", "pill", "Build", 230, 100),
    node("test", "pill", "Run Tests", 460, 100),
    node("gate", "diamond", "Tests Passed?", 730, 100),
    node("notify", "hexagon", "Notify Team", 730, -110),
    node("registry", "cylinder", "Image Registry", 730, 310),
    node("staging", "pill", "Deploy Staging", 460, 310),
    node("production", "pill", "Deploy Production", 230, 310),
  ],
  edges: [
    edge("push", "build"),
    edge("build", "test"),
    edge("test", "gate"),
    edge("gate", "notify", "top", "bottom"),
    edge("gate", "registry", "bottom", "top"),
    edge("registry", "staging", "left", "right"),
    edge("staging", "production", "left", "right"),
  ],
};

const EVENT_DRIVEN_SYSTEM: CanvasTemplate = {
  id: "event-driven-system",
  name: "Event-Driven System",
  description:
    "Services publish events to a shared bus, and independent consumers react to them on their own.",
  nodes: [
    node("orders", "pill", "Order Service", 0, 60),
    node("billing", "pill", "Billing Service", 0, 220),
    // Tall, so every producer and consumer visibly hangs off one bus.
    node("bus", "rectangle", "Event Bus", 240, 140, { width: 120, height: 260 }),
    node("notifications", "pill", "Notifications", 500, 0),
    node("inventory", "pill", "Inventory Service", 500, 140),
    node("analytics", "pill", "Analytics Service", 500, 280),
    node("email-provider", "hexagon", "Email Provider", 760, 0),
    node("inventory-db", "cylinder", "Inventory DB", 760, 140),
    node("warehouse", "cylinder", "Data Warehouse", 760, 280),
  ],
  edges: [
    edge("orders", "bus"),
    edge("billing", "bus"),
    edge("bus", "notifications"),
    edge("bus", "inventory"),
    edge("bus", "analytics"),
    edge("notifications", "email-provider"),
    edge("inventory", "inventory-db"),
    edge("analytics", "warehouse"),
  ],
};

export const CANVAS_TEMPLATES: readonly CanvasTemplate[] = [
  MICROSERVICES,
  CI_CD_PIPELINE,
  EVENT_DRIVEN_SYSTEM,
];
