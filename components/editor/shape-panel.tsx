"use client";

import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createShapeDragPayload, writeShapeDragPayload } from "@/lib/canvas-drag";
import type { NodeShape } from "@/types/canvas";

interface ShapeOption {
  shape: NodeShape;
  label: string;
  icon: LucideIcon;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", icon: Diamond },
  { shape: "circle", label: "Circle", icon: Circle },
  { shape: "pill", label: "Pill", icon: Pill },
  { shape: "cylinder", label: "Cylinder", icon: Database },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon },
];

// Floating pill-shaped toolbar at the bottom-center of the canvas. Each button is a drag
// source: dropping it on the canvas creates a node (the drop is handled by `Canvas`).
export function ShapePanel() {
  return (
    <div
      role="toolbar"
      aria-label="Shapes"
      className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border-subtle bg-surface/90 p-1.5 shadow-lg backdrop-blur-xl"
    >
      {SHAPE_OPTIONS.map(({ shape, label, icon: Icon }) => (
        <Button
          key={shape}
          type="button"
          variant="ghost"
          size="icon-lg"
          draggable
          onDragStart={(event) =>
            writeShapeDragPayload(event.dataTransfer, createShapeDragPayload(shape))
          }
          aria-label={`Drag to add a ${label.toLowerCase()}`}
          title={label}
          className="cursor-grab rounded-full text-copy-muted hover:text-copy-primary active:cursor-grabbing"
        >
          <Icon className="h-5 w-5" />
        </Button>
      ))}
    </div>
  );
}
