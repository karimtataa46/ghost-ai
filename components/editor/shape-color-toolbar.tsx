"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { NODE_COLORS, type NodeFill } from "@/types/canvas";

interface ShapeColorToolbarProps {
  // The shape being colored, for the toolbar's accessible name ("Circle color").
  shapeLabel: string;
  // The shape's current color, one of the palette's `fill` values.
  color: string;
  onColorChange: (fill: NodeFill) => void;
}

// A small toolbar of swatches, one per palette color pair, for choosing the selected shape's
// color. Picking one hands the pair's fill to `onColorChange`; a node draws its text color from
// the fill, so background and text change together. Presentational: the shape panel decides
// when it shows and where the color is stored. It sits in the shape panel, outside the React
// Flow canvas, so a press on it cannot drag a node or pan the canvas.
export function ShapeColorToolbar({ shapeLabel, color, onColorChange }: ShapeColorToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={`${shapeLabel} color`}
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border-subtle bg-surface/90 px-3 py-2 shadow-lg backdrop-blur-xl"
    >
      {NODE_COLORS.map(({ name, fill, text }) => {
        const isActive = fill === color;

        return (
          <button
            key={fill}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={isActive}
            // `currentColor` is the pair's text color, so the dot, the check, the active ring,
            // and the hover glow all come from it.
            style={{ backgroundColor: fill, color: text }}
            onClick={() => onColorChange(fill)}
            className={cn(
              "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-surface-border-subtle transition-shadow outline-none",
              "hover:shadow-[0_0_6px_1px_color-mix(in_srgb,currentColor_55%,transparent)]",
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
              isActive && "ring-2 ring-current ring-offset-2 ring-offset-surface",
            )}
          >
            {isActive ? (
              <Check aria-hidden className="size-3.5" strokeWidth={3} />
            ) : (
              <span aria-hidden className="size-2 rounded-full bg-current" />
            )}
          </button>
        );
      })}
    </div>
  );
}
