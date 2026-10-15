"use client";

import "@xyflow/react/dist/style.css";

import { useCanRedo, useCanUndo, useRedo, useRoom, useUndo } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";

import { CanvasControls } from "@/components/editor/canvas-controls";
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import {
  useRegisterCanvasSave,
  type CanvasSaveControls,
} from "@/components/editor/canvas-save-provider";
import { LiveCursors } from "@/components/editor/live-cursors";
import { ShapeColorsProvider } from "@/components/editor/shape-colors-provider";
import { ShapePanel } from "@/components/editor/shape-panel";
import { useRegisterTemplateImporter } from "@/components/editor/template-import-provider";
import { useBoxSelectEdges } from "@/hooks/use-box-select-edges";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { useCanvasLoad } from "@/hooks/use-canvas-load";
import { useCursorPresence } from "@/hooks/use-cursor-presence";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useShapeColorStorage } from "@/hooks/use-shape-color-storage";
import { useShapeDrop } from "@/hooks/use-shape-drop";
import { useTemplateImport } from "@/hooks/use-template-import";
import { CANVAS_EDGE_TYPE, defaultEdgeOptions } from "@/lib/canvas-edges";
import { DEFAULT_CANVAS_TOOL, getCanvasToolProps } from "@/lib/canvas-tools";
import type { CanvasEdge, CanvasNode, CanvasTool } from "@/types/canvas";

interface CanvasProps {
  // The project ID (the same value as the Liveblocks room ID), for saving and loading the canvas.
  projectId: string;
}

// Defined outside the component so React Flow gets the same object on every render.
const nodeTypes: NodeTypes = { canvasNode: CanvasNodeRenderer };
const edgeTypes: EdgeTypes = { [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer };

// The collaborative canvas: React Flow driven by the Liveblocks room's Storage, so every
// node and edge change is shared. Suspends until Storage is ready, so it must render inside
// `ClientSideSuspense` under a `RoomProvider` (see `CanvasRoom`).
function CanvasSurface({ projectId }: CanvasProps) {
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
  // Where this user's pointer is, shared through Liveblocks presence (not Storage) so the other
  // people in the room see it; they are drawn by `LiveCursors` below.
  const { onMouseMove, onMouseLeave } = useCursorPresence();
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
  // `A` switches to the select tool and `H` to the hand (pan) tool, the same as the control bar's
  // buttons.
  useKeyboardShortcuts({ reactFlow, onUndo: undo, onRedo: redo, onToolChange: setTool });
  // A box drawn with the select tool also picks the edges it passes through (React Flow's own
  // box only picks the edges connected to the nodes it touches).
  const onSelectionEnd = useBoxSelectEdges(onEdgesChange);
  // Importing a starter template replaces the canvas through these same handlers. The navbar's
  // Templates button lives in the workspace shell, outside the room, so the importer is handed up
  // to it. The room's `batch` makes the whole replace a single undo step.
  const room = useRoom();
  const importTemplate = useTemplateImport({ room, onNodesChange, onEdgesChange, onDelete });
  useRegisterTemplateImporter(importTemplate);
  // Persistence (the room's Storage already lives in Liveblocks; this keeps a copy in Vercel Blob
  // through the canvas API). A room that starts empty gets the saved canvas back first, and
  // autosave only starts after that, so it can never replace the saved canvas with an empty one.
  const load = useCanvasLoad({
    projectId,
    roomHasContent: nodes.length > 0 || edges.length > 0,
    onNodesChange,
    onEdgesChange,
  });
  const autosave = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: load.state === "ready",
  });
  // What the navbar's Save button shows. A failed load pauses autosave (it would overwrite a
  // saved canvas the editor could not read), and the button retries the load instead of saving.
  const saveControls = useMemo<CanvasSaveControls>(() => {
    if (load.state === "failed") {
      return { status: "error", error: load.error, onSave: load.retry };
    }

    return {
      status: autosave.status,
      error: autosave.error,
      onSave: load.state === "ready" ? autosave.saveNow : null,
    };
  }, [load.state, load.error, load.retry, autosave.status, autosave.error, autosave.saveNow]);
  useRegisterCanvasSave(saveControls);

  return (
    <ShapeColorsProvider colors={colors} onChange={setColor}>
      <div className="relative min-h-0 flex-1" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          onSelectionEnd={onSelectionEnd}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          connectionMode={ConnectionMode.Loose}
          {...getCanvasToolProps(tool)}
          colorMode="dark"
          fitView
        >
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} />
          <LiveCursors />
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
export function Canvas({ projectId }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasSurface projectId={projectId} />
    </ReactFlowProvider>
  );
}
