"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  SHAPE_DEFAULT_COLORS,
  isNodeFill,
  type NodeFill,
  type NodeShape,
  type ShapeColors,
} from "@/types/canvas";

interface ShapeColorsValue {
  // The color every node of `shape` has: the picked one, else the shape's default.
  getColor: (shape: NodeShape) => NodeFill;
  setColor: (shape: NodeShape, fill: NodeFill) => void;
}

const ShapeColorsContext = createContext<ShapeColorsValue | null>(null);

interface ShapeColorsProviderProps {
  // The picked colors (the room's `shapeColors`), or `undefined` while none have been picked.
  colors: ShapeColors | undefined;
  onChange: (shape: NodeShape, fill: NodeFill) => void;
  children: ReactNode;
}

// Hands the canvas's shape colors to everything that draws or picks one: the node renderer, the
// shape panel and its drag ghost. Where the colors live (the room's Storage) is the caller's
// business, so this stays a plain context and does not need a room.
export function ShapeColorsProvider({ colors, onChange, children }: ShapeColorsProviderProps) {
  const value = useMemo<ShapeColorsValue>(
    () => ({
      getColor: (shape) => {
        // Storage outlives this code, so a value that is not a palette fill counts as unset.
        const picked = colors?.[shape];
        return isNodeFill(picked) ? picked : SHAPE_DEFAULT_COLORS[shape];
      },
      setColor: onChange,
    }),
    [colors, onChange],
  );

  return <ShapeColorsContext.Provider value={value}>{children}</ShapeColorsContext.Provider>;
}

export function useShapeColors(): ShapeColorsValue {
  const value = useContext(ShapeColorsContext);
  if (!value) throw new Error("useShapeColors must be used inside a ShapeColorsProvider");
  return value;
}
