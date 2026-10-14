"use client";

import { useReactFlow } from "@xyflow/react";
import {
  Hand,
  Maximize,
  MousePointer2,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ZOOM_ANIMATION } from "@/lib/canvas-zoom";
import { cn } from "@/lib/utils";
import type { CanvasEdge, CanvasNode, CanvasTool } from "@/types/canvas";

interface CanvasControlsProps {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  // Set for a tool button: whether it is the active tool.
  pressed?: boolean;
}

function ControlButton({ icon: Icon, label, onClick, disabled, pressed }: ControlButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "rounded-full text-copy-muted hover:text-copy-primary",
        pressed && "bg-subtle text-copy-primary",
      )}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}

function Divider() {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="mx-1 h-5 w-px shrink-0 bg-surface-border-subtle"
    />
  );
}

// Floating pill-shaped control bar at the bottom-left of the canvas, in three groups split by
// thin dividers: the tool (select or pan), zoom (out, fit view, in), and history (undo, redo).
// The tool is chosen here and applied by `Canvas` (see `lib/canvas-tools.ts`). Zoom goes through
// the React Flow instance; undo and redo are the Liveblocks history handlers and state, passed
// in by `Canvas` (which also binds the handlers to the keyboard), and each button is disabled
// (and dimmed by `Button`) when there is nothing to do. Needs a `ReactFlowProvider` but no
// room, so it can be rendered alone.
export function CanvasControls({
  tool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow<CanvasNode, CanvasEdge>();

  return (
    // Above the shape panel (`z-10`) in case a narrow canvas makes the two overlap.
    <div
      role="toolbar"
      aria-label="Canvas controls"
      className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-full border border-surface-border-subtle bg-surface/90 p-1.5 shadow-lg backdrop-blur-xl"
    >
      <ControlButton
        icon={MousePointer2}
        label="Select: drag to select nodes"
        pressed={tool === "select"}
        onClick={() => onToolChange("select")}
      />
      <ControlButton
        icon={Hand}
        label="Pan: drag to move the view"
        pressed={tool === "pan"}
        onClick={() => onToolChange("pan")}
      />
      <Divider />
      <ControlButton icon={ZoomOut} label="Zoom out" onClick={() => zoomOut(ZOOM_ANIMATION)} />
      <ControlButton icon={Maximize} label="Fit view" onClick={() => fitView(ZOOM_ANIMATION)} />
      <ControlButton icon={ZoomIn} label="Zoom in" onClick={() => zoomIn(ZOOM_ANIMATION)} />
      <Divider />
      <ControlButton icon={Undo2} label="Undo" onClick={onUndo} disabled={!canUndo} />
      <ControlButton icon={Redo2} label="Redo" onClick={onRedo} disabled={!canRedo} />
    </div>
  );
}
