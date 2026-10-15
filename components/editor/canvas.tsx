"use client";

import "@xyflow/react/dist/style.css";

import { useCanRedo, useCanUndo, useRedo, useRoom, useUndo } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useCallback, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";

import { CanvasControls } from "@/components/editor/canvas-controls";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapeColorsProvider } from "@/components/editor/shape-colors-provider";
import { ShapePanel } from "@/components/editor/shape-panel";
import { useRegisterTemplateImporter } from "@/components/editor/template-import-provider";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useShapeColorStorage } from "@/hooks/use-shape-color-storage";
import { useShapeDrop } from "@/hooks/use-shape-drop";
import { useTemplateImport } from "@/hooks/use-template-import";
import { defaultEdgeOptions } from "@/lib/canvas-edges";
import { selectAllNodes } from "@/lib/canvas-nodes";
import { DEFAULT_CANVAS_TOOL, getCanvasToolProps } from "@/lib/canvas-tools";
import type { CanvasEdge, CanvasNode, CanvasTool } from "@/types/canvas";

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
  // A dropped shape becomes an `add` change, which the Liveblocks handler writes to Storage. A
  // shape added from the keyboard or by touch takes the same route, at the center of the view.
  const { onDragOver, onDrop, addShapeAtCenter } = useShapeDrop(onNodesChange);
  // The color of each shape type, shared through Storage: the nodes draw it and the shape panel
  // changes it.
  const { colors, setColor } = useShapeColorStorage();
  // Undo and redo walk the room's Liveblocks history. The control bar buttons and the keyboard
  // shortcuts share these handlers; the zoom shortcuts use the React Flow instance.
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  // What a drag on empty canvas does: pan the view, or draw a selection box to pick several nodes
  // (then drag one to move them all, or press Backspace / Delete to remove them). UI state only,
  // never synced.
  const [tool, setTool] = useState<CanvasTool>(DEFAULT_CANVAS_TOOL);
  // `A`: switch to the select tool and select every node. Reads the nodes from React Flow when it
  // runs, so the shortcut does not depend on (and re-bind with) every node change.
  const selectAll = useCallback(() => {
    setTool("select");
    onNodesChange(selectAllNodes(reactFlow.getNodes()));
  }, [reactFlow, onNodesChange]);
  useKeyboardShortcuts({ reactFlow, onUndo: undo, onRedo: redo, onSelectAll: selectAll });
  // Importing a starter template replaces the canvas through these same handlers. The navbar's
  // Templates button lives in the workspace shell, outside the room, so the importer is handed up
  // to it. The room's `batch` makes the whole replace a single undo step.
  const room = useRoom();
  const importTemplate = useTemplateImport({ room, onNodesChange, onEdgesChange, onDelete });
  useRegisterTemplateImporter(importTemplate);

  return (
    <ShapeColorsProvider colors={colors} onChange={setColor}>
      <div className="relative min-h-0 flex-1" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          connectionMode={ConnectionMode.Loose}
          {...getCanvasToolProps(tool)}
          colorMode="dark"
          fitView
        >
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} />
        </ReactFlow>
        <ShapePanel onAddShape={addShapeAtCenter} />
        <CanvasControls
          tool={tool}
          onToolChange={setTool}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />
      </div>
    </ShapeColorsProvider>
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
