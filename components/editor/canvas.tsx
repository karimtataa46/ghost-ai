"use client";

import "@xyflow/react/dist/style.css";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from "@xyflow/react";

import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import { useShapeDrop } from "@/hooks/use-shape-drop";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

// Defined outside the component so React Flow gets the same object on every render.
const nodeTypes: NodeTypes = { canvasNode: CanvasNodeRenderer };

// The collaborative canvas: React Flow driven by the Liveblocks room's Storage, so every
// node and edge change is shared. Suspends until Storage is ready, so it must render inside
// `ClientSideSuspense` under a `RoomProvider` (see `CanvasRoom`).
function CanvasSurface() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      // A new room starts empty; the hook seeds Storage with these once, if it has no flow yet.
      nodes: { initial: [] },
      edges: { initial: [] },
    });
  // A dropped shape becomes an `add` change, which the Liveblocks handler writes to Storage.
  const { onDragOver, onDrop } = useShapeDrop(onNodesChange);

  return (
    <div className="relative min-h-0 flex-1" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        fitView
      >
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}

// `useShapeDrop` converts drop coordinates through React Flow, which needs a provider above
// the component that calls it, so the provider wraps the surface instead of living inside it.
export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasSurface />
    </ReactFlowProvider>
  );
}
