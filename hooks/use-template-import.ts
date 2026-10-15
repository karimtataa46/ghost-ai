"use client";

import {
  useReactFlow,
  type EdgeChange,
  type NodeChange,
  type OnDelete,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { useCallback } from "react";

import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { ZOOM_ANIMATION } from "@/lib/canvas-zoom";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface TemplateImportOptions {
  // The collaborative canvas state's handlers, from `useLiveblocksFlow`.
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
  onDelete: OnDelete<CanvasNode, CanvasEdge>;
  // The room (or anything with its `batch`): everything written inside one call is one undo step.
  room: { batch: <T>(callback: () => T) => T };
}

// Copies, so the room never holds (or React Flow never adds fields to) the template's own objects
// and the next import starts from the same data.
function copyNodes(nodes: readonly CanvasNode[]): CanvasNode[] {
  return nodes.map((node) => ({ ...node, position: { ...node.position }, data: { ...node.data } }));
}

function copyEdges(edges: readonly CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }));
}

// Returns a function that replaces the canvas with a template: everything on it is deleted, then
// the template's nodes and edges are added, then the view is fitted to them. All of it goes
// through the canvas's own Liveblocks handlers, so it is shared with every collaborator like any
// other edit. Must run under a `ReactFlowProvider`. The returned function keeps its identity
// while the handlers do, so it can be registered once (`useRegisterTemplateImporter`).
export function useTemplateImport({
  onNodesChange,
  onEdgesChange,
  onDelete,
  room,
}: TemplateImportOptions) {
  const { getNodes, getEdges, fitView } = useReactFlow<CanvasNode, CanvasEdge>();

  return useCallback(
    (template: CanvasTemplate) => {
      const nodes = copyNodes(template.nodes);
      const edges = copyEdges(template.edges);

      // One batch is one undo step, so a single undo brings the previous canvas back.
      room.batch(() => {
        // Clearing goes through `onDelete`: the Liveblocks `onNodesChange` / `onEdgesChange`
        // ignore `remove` changes, so those would leave everything in place. The current nodes
        // and edges are read when this runs, not when it was created, so it never deletes a stale
        // list.
        onDelete({ nodes: getNodes(), edges: getEdges() });
        onNodesChange(nodes.map((item): NodeChange<CanvasNode> => ({ type: "add", item })));
        onEdgesChange(edges.map((item): EdgeChange<CanvasEdge> => ({ type: "add", item })));
      });

      // React Flow holds the fit until the new nodes are measured, so asking now fits them and
      // not what was there before.
      void fitView(ZOOM_ANIMATION);
    },
    [room, onDelete, onNodesChange, onEdgesChange, getNodes, getEdges, fitView],
  );
}
