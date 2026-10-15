import { getPreviewLayout, type PreviewNode, type PreviewViewport } from "@/lib/canvas-preview";
import { getShapePaths, isSvgNodeShape } from "@/lib/canvas-shapes";
import { EDGE_COLOR } from "@/types/canvas";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

// The preview's own coordinate box. The SVG scales to its card's width, so the layout is the same
// everywhere.
const VIEWPORT: PreviewViewport = { width: 320, height: 180, padding: 16 };

// The corner radius of a rectangle node on the canvas (`rounded-xl`), before the preview scales it.
const RECTANGLE_RADIUS = 12;

// The outline is 1px and centered on the edge, so shapes are pulled in by half of it to keep
// the whole stroke inside their box (as `getShapePaths` does for the SVG shapes).
const STROKE_INSET = 0.5;

const SHAPE_STROKE = "stroke-surface-border-subtle";

function PreviewShape({ node, scale }: { node: PreviewNode; scale: number }) {
  const { shape, color, x, y, width, height } = node;

  if (isSvgNodeShape(shape)) {
    const { body, detail } = getShapePaths(shape, width, height);
    return (
      <g transform={`translate(${x} ${y})`}>
        <path d={body} fill={color} strokeWidth={1} strokeLinejoin="round" className={SHAPE_STROKE} />
        {detail && <path d={detail} fill="none" strokeWidth={1} className={SHAPE_STROKE} />}
      </g>
    );
  }

  const boxX = x + STROKE_INSET;
  const boxY = y + STROKE_INSET;
  const boxWidth = width - STROKE_INSET * 2;
  const boxHeight = height - STROKE_INSET * 2;

  // Circle and pill are fully rounded boxes on the canvas, so a circle is an ellipse here too if
  // its box is not square.
  if (shape === "circle") {
    return (
      <ellipse
        cx={x + width / 2}
        cy={y + height / 2}
        rx={boxWidth / 2}
        ry={boxHeight / 2}
        fill={color}
        strokeWidth={1}
        className={SHAPE_STROKE}
      />
    );
  }

  return (
    <rect
      x={boxX}
      y={boxY}
      width={boxWidth}
      height={boxHeight}
      rx={shape === "pill" ? boxHeight / 2 : RECTANGLE_RADIUS * scale}
      fill={color}
      strokeWidth={1}
      className={SHAPE_STROKE}
    />
  );
}

// A small picture of a template's diagram: its edges as lines between node centers, and its nodes
// drawn with their shape and color on top. One SVG computed from the template's positions
// (`getPreviewLayout`), with no React Flow instance, so a grid of them stays cheap. Decorative:
// the card around it carries the template's name and description.
export function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { scale, nodes, edges } = getPreviewLayout(template.nodes, template.edges, VIEWPORT);

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-base">
      <svg
        aria-hidden
        viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
        className="block h-auto w-full"
      >
        {/* Edges first, so a node covers the end of the line that reaches its center. */}
        {edges.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={EDGE_COLOR}
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        ))}
        {nodes.map((node) => (
          <PreviewShape key={node.id} node={node} scale={scale} />
        ))}
      </svg>
    </div>
  );
}
