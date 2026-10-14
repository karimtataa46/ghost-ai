import type { ReactNode } from "react";

import { getShapePaths, isSvgNodeShape, type SvgNodeShape } from "@/lib/canvas-shapes";
import { cn } from "@/lib/utils";
import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_LABEL_PLACEHOLDER,
  type NodeShape,
} from "@/types/canvas";

interface CanvasShapeProps {
  shape: NodeShape;
  // Fill color, one of the palette's `fill` values.
  color: string;
  label: string;
  selected?: boolean;
  // The box the shape fills, in pixels. The SVG shapes are drawn from these numbers.
  width: number;
  height: number;
  // Shown instead of the label text, in the same centered box (the inline label editor).
  labelEditor?: ReactNode;
  // Called when the user asks to edit the label: a double-click on the label box, or a click on
  // the placeholder an empty label shows. Without it the shape is display-only.
  onEditLabel?: () => void;
}

// The text color paired with a node fill in the palette; unknown fills use the default's.
export function getNodeTextColor(fill: string): string {
  return NODE_COLORS.find((color) => color.fill === fill)?.text ?? DEFAULT_NODE_COLOR.text;
}

// The corner radius of the CSS shapes. The circle is a full radius too, so it stays round
// whatever the node's size (an ellipse if the box is not square).
const CSS_SHAPE_RADIUS: Record<Exclude<NodeShape, SvgNodeShape>, string> = {
  rectangle: "rounded-xl",
  pill: "rounded-full",
  circle: "rounded-full",
};

// Where the label may sit, as a CSS `inset` (top, sides, bottom): the largest box that stays
// inside each outline, so text is not drawn over a slanted edge or the cylinder's lip.
const LABEL_INSET: Record<NodeShape, string> = {
  rectangle: "0 12px",
  pill: "0 16px",
  circle: "15%",
  diamond: "25%",
  hexagon: "20% 15%",
  cylinder: "30% 12px 5%",
};

function SvgShape({
  shape,
  color,
  selected,
  width,
  height,
}: Pick<CanvasShapeProps, "color" | "selected" | "width" | "height"> & { shape: SvgNodeShape }) {
  const { body, detail } = getShapePaths(shape, width, height);
  // Subtle at rest, brand cyan when selected: the same two colors as the CSS shapes' border.
  const outline = selected ? "stroke-brand" : "stroke-surface-border-subtle";

  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path d={body} fill={color} strokeWidth={1} strokeLinejoin="round" className={outline} />
      {detail && <path d={detail} fill="none" strokeWidth={1} className={outline} />}
    </svg>
  );
}

// One node's visual: the shape (CSS for rectangle, pill, and circle; SVG for diamond, hexagon,
// and cylinder) with the label centered in it. Used by the canvas node and by the shape drag
// preview, so a ghost looks exactly like the node it will become.
export function CanvasShape({
  shape,
  color,
  label,
  selected = false,
  width,
  height,
  labelEditor,
  onEditLabel,
}: CanvasShapeProps) {
  // An empty (or blank) label shows the dimmed placeholder, so it is clear the node takes text.
  // It is in the label box like the text it stands for, and the editor shows the same word.
  const isBlank = label.trim() === "";
  const labelContent = isBlank ? (
    <span
      className={cn("opacity-50", onEditLabel && "cursor-text")}
      onClick={onEditLabel}
    >
      {NODE_LABEL_PLACEHOLDER}
    </span>
  ) : (
    label
  );

  return (
    <div className="relative" style={{ width, height, color: getNodeTextColor(color) }}>
      {isSvgNodeShape(shape) ? (
        <SvgShape shape={shape} color={color} selected={selected} width={width} height={height} />
      ) : (
        <div
          className={cn(
            "absolute inset-0 border",
            CSS_SHAPE_RADIUS[shape],
            selected ? "border-brand" : "border-surface-border-subtle",
          )}
          style={{ backgroundColor: color }}
        />
      )}
      {/* `whitespace-pre-wrap` keeps the line breaks a label was typed with, like the editor. */}
      <div
        className="absolute flex items-center justify-center text-center text-sm whitespace-pre-wrap wrap-anywhere"
        style={{ inset: LABEL_INSET[shape] }}
        onDoubleClick={onEditLabel}
      >
        {labelEditor ?? labelContent}
      </div>
    </div>
  );
}
