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
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { getNodeTextColor } from "@/components/editor/canvas-shape";
import { ShapeColorToolbar } from "@/components/editor/shape-color-toolbar";
import { useShapeColors } from "@/components/editor/shape-colors-provider";
import { ShapeDragPreview } from "@/components/editor/shape-drag-preview";
import { Button } from "@/components/ui/button";
import {
  createShapeDragPayload,
  hideNativeDragImage,
  writeShapeDragPayload,
} from "@/lib/canvas-drag";
import { cn } from "@/lib/utils";
import type { NodeShape, ShapeDragPayload } from "@/types/canvas";

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

// A drag in progress: what it carries and where the cursor was when it started.
interface ActiveDrag {
  payload: ShapeDragPayload;
  x: number;
  y: number;
}

interface ShapePanelProps {
  // Adds a node of the given shape (and default size) at the center of the visible canvas.
  onAddShape: (payload: ShapeDragPayload) => void;
}

// Floating pill-shaped toolbar at the bottom-center of the canvas. Each button is a drag
// source: dropping it on the canvas creates a node (the drop is handled by `Canvas`), and a
// ghost of the shape follows the cursor until the drag ends. Clicking a button with a mouse
// instead selects that shape and opens a color toolbar above the panel; the color picked there
// is the color of every node of that shape. A keyboard or touch activation cannot drag, so it
// adds the shape at the center of the canvas (`onAddShape`) and opens the same color toolbar.
// Renders inside a `ReactFlowProvider` (the ghost reads the canvas zoom) and a
// `ShapeColorsProvider` (where the colors live).
export function ShapePanel({ onAddShape }: ShapePanelProps) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  // The shape whose color toolbar is open. UI state only, never synced.
  const [colorShape, setColorShape] = useState<NodeShape | null>(null);
  const { getColor, setColor } = useShapeColors();
  // The panel and its color toolbar, so a press anywhere else can close the toolbar.
  const rootRef = useRef<HTMLDivElement>(null);
  // The kind of pointer behind the latest press on a button ("mouse", "pen", "touch"), read by
  // the click that follows it. A key press has no pointer, so it leaves this empty.
  const pointerTypeRef = useRef("");

  // A click comes from a keyboard when its `detail` (the click count) is 0, and from a finger when
  // the press before it was a touch. Neither can start the HTML5 drag the panel is built on (touch
  // never fires `dragstart`, and a key press is no drag), so they add the shape directly. Left to
  // a mouse, a click only opens or closes the color toolbar, as a drag is how it adds one.
  function onShapeClick(event: MouseEvent<HTMLButtonElement>, shape: NodeShape) {
    const pointerType = pointerTypeRef.current;
    pointerTypeRef.current = "";

    if (event.detail > 0 && pointerType !== "touch") {
      setColorShape(shape === colorShape ? null : shape);
      return;
    }

    onAddShape(createShapeDragPayload(shape));
    // Opened rather than toggled: closing is Escape or a press elsewhere, so the same key press
    // or tap that adds a shape never also hides the toolbar that lets its color be changed.
    setColorShape(shape);
  }

  // While the toolbar is open, a press outside the panel or Escape closes it. The press listener
  // is in the capture phase so it still runs when the canvas handles the press itself.
  useEffect(() => {
    if (!colorShape) return;

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setColorShape(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setColorShape(null);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [colorShape]);

  const colorOption = SHAPE_OPTIONS.find((option) => option.shape === colorShape);

  return (
    <>
      {/* `pointer-events-none` on the wrapper, so the empty space beside the narrower of the two
          children does not swallow canvas clicks and drops; the children turn it back on. */}
      <div
        ref={rootRef}
        className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {colorOption && colorShape && (
          <ShapeColorToolbar
            shapeLabel={colorOption.label}
            color={getColor(colorShape)}
            onColorChange={(fill) => setColor(colorShape, fill)}
          />
        )}
        <div
          role="toolbar"
          aria-label="Shapes"
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border-subtle bg-surface/90 p-1.5 shadow-lg backdrop-blur-xl"
        >
          {SHAPE_OPTIONS.map(({ shape, label, icon: Icon }) => {
            const isSelected = shape === colorShape;

            return (
              <Button
                key={shape}
                type="button"
                variant="ghost"
                size="icon-lg"
                draggable
                onPointerDown={(event) => {
                  pointerTypeRef.current = event.pointerType;
                }}
                // A mouse click (a press with no drag) opens this shape's color toolbar, or closes
                // it when it is already open; a key press or tap also adds the shape.
                onClick={(event) => onShapeClick(event, shape)}
                onDragStart={(event) => {
                  const payload = createShapeDragPayload(shape);
                  writeShapeDragPayload(event.dataTransfer, payload);
                  hideNativeDragImage(event.dataTransfer);
                  setActiveDrag({ payload, x: event.clientX, y: event.clientY });
                }}
                // Fires after a drop and when the drag is cancelled (Escape, or released off the page).
                onDragEnd={() => setActiveDrag(null)}
                aria-label={`${label}: drag to place one, or press to add one at the center and change its color`}
                aria-pressed={isSelected}
                title={label}
                className={cn(
                  "cursor-grab rounded-full text-copy-muted hover:text-copy-primary active:cursor-grabbing",
                  isSelected && "bg-subtle",
                )}
              >
                {/* The selected shape's icon takes its current color, so the panel shows which
                    color it has now. */}
                <Icon
                  className="h-5 w-5"
                  style={isSelected ? { color: getNodeTextColor(getColor(shape)) } : undefined}
                />
              </Button>
            );
          })}
        </div>
      </div>
      {activeDrag && <ShapeDragPreview {...activeDrag} />}
    </>
  );
}
