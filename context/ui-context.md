# UI Context

## Theme

Dark only. No light mode. The visual language is a dark technical workspace — near-black backgrounds, layered surfaces, and vivid accent colors for interactive elements.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes like `zinc-*`.

| Role             | CSS Variable           | Hex / Value               |
| ---------------- | ---------------------- | ------------------------- |
| Page background  | `--bg-base`            | `#080809`                 |
| Surface          | `--bg-surface`         | `#111114`                 |
| Elevated surface | `--bg-elevated`        | `#18181c`                 |
| Subtle surface   | `--bg-subtle`          | `#1e1e23`                 |
| Default border   | `--border-default`     | `#2a2a30`                 |
| Subtle border    | `--border-subtle`      | `#3a3a42`                 |
| Primary text     | `--text-primary`       | `#f0f0f4`                 |
| Secondary text   | `--text-secondary`     | `#c0c0cc`                 |
| Muted text       | `--text-muted`         | `#808090`                 |
| Faint text       | `--text-faint`         | `#505060`                 |
| Brand accent     | `--accent-primary`     | `#00c8d4` (cyan)          |
| Brand dim        | `--accent-primary-dim` | `rgba(0, 200, 212, 0.12)` |
| AI accent        | `--accent-ai`          | `#6457f9` (indigo-purple) |
| AI text          | `--accent-ai-text`     | `#8b82ff`                 |
| Error            | `--state-error`        | `#ff4d4f`                 |
| Success          | `--state-success`      | `#34d399`                 |
| Warning          | `--state-warning`      | `#fbbf24`                 |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

## Typography

| Role      | Font       | CSS Variable        |
| --------- | ---------- | ------------------- |
| UI text   | Geist Sans | `--font-geist-sans` |
| Code/mono | Geist Mono | `--font-geist-mono` |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`.

## Border Radius

Radius increases with surface depth — smaller for inner elements, larger for outer containers.

| Context           | Class         |
| ----------------- | ------------- |
| Inline / small UI | `rounded-xl`  |
| Cards / panels    | `rounded-2xl` |
| Modal / overlay   | `rounded-3xl` |

## Canvas

### Node Color Palette

8 defined color pairs. Each pair specifies a dark node fill and a vivid contrasting text color tuned for readability on the dark canvas. Defined in `types/canvas.ts` as `NODE_COLORS`, each with a `name` (used as the swatch label in the color toolbar). The palette is not in `globals.css`: these are canvas data applied as inline styles, like the node fills themselves.

| Node fill | Text color | Name / character      |
| --------- | ---------- | --------------------- |
| `#1F1F1F` | `#EDEDED`  | Neutral (dark, default) |
| `#10233D` | `#52A8FF`  | Blue                  |
| `#2E1938` | `#BF7AF0`  | Purple                |
| `#331B00` | `#FF990A`  | Orange                |
| `#3C1618` | `#FF6166`  | Red                   |
| `#3A1726` | `#F75F8F`  | Pink                  |
| `#0F2E18` | `#62C073`  | Green                 |
| `#062822` | `#0AC7B4`  | Teal                  |

Color belongs to the shape, not to the node: every node of a shape draws the same color, so two circles always match. Until someone picks another one (see Shape Colors), a shape has its default (`SHAPE_DEFAULT_COLORS` in `types/canvas.ts`, each a palette fill, so the vivid text color of the pair is used for its label): rectangle blue, diamond orange (decision), circle green (event), pill purple (service), cylinder teal (database), hexagon pink (external). Red is not a default because it reads as an error. `#1F1F1F` with `#EDEDED` text (neutral) is `DEFAULT_NODE_COLOR`, the text-color fallback for a fill that is not in the palette.

### Cursor Colors

Each collaborator's cursor color is one of the 7 vivid text colors above (blue, purple, orange, red, pink, green, teal; the neutral `#EDEDED` is excluded because it would not stand out). `getCursorColor(userId)` in `lib/cursor-color.ts` hashes the user ID onto that list, so a person keeps the same color in every session. The color is attached to the Liveblocks session as `info.color` when the token is issued.

### Presence

Who else is in the room, drawn inside the canvas area only (the editor home has no canvas, so none of this appears there, and the navbar is unchanged). Both parts leave out the viewer, decided by the Clerk user ID (see `architecture-context.md`).

- Avatar group (`components/editor/presence-avatars.tsx`): `absolute top-4 right-4 z-10`, a `flex items-center gap-3` row with `pointer-events-none` (it never blocks the canvas under it; only the `UserButton` wrapper is `pointer-events-auto`). Left to right: the collaborators as an overlapping stack (`ul`, `-space-x-1.5`), a divider (`role="separator"`, `h-5 w-px bg-surface-border-subtle`, the same as the control bar's), then the Clerk `UserButton`. With nobody else in the room it is the `UserButton` alone, no stack and no divider. The group does not use a panel background. The navbar keeps its own `UserButton` too (see the Workspace Shell), so there are two on screen; with the AI sidebar open (`z-30`) it covers this one.
- Collaborator avatar (`components/editor/participant-avatar.tsx`): display only (no hover, click, or tooltip), `size-7` (28px, measured to equal the `UserButton`'s avatar so the row is one size), `rounded-full`, `ring-2 ring-surface-border-subtle` (readable on the dark canvas, and it separates the avatars where they overlap). The profile photo when there is one (`info.avatar`, through `next/image` with `unoptimized`, like the share dialog), otherwise up to two initials (`getInitials` in `lib/initials.ts`: first letters of the first and last words) on `bg-subtle` in `text-xs font-medium text-copy-secondary`; a photo that fails to load falls back to the initials. `role="img"` with `aria-label` the person's name. Up to 5 avatars show; beyond that a `+N` chip of the same size and ring (`N` = people not shown) ends the stack.
- Live cursor (`components/editor/live-cursors.tsx`): a 16 x 20 arrow in the person's color with a 1px `--bg-base` outline, and under it a name badge (`rounded-xl`, `px-2 py-0.5`, `text-xs font-medium`, truncated at `max-w-40`) in the same color with `--bg-base` text, because the vivid colors are all light enough for near-black text to read on. The pointer and badge keep their on-screen size at any zoom. A cursor is hidden while that person's `cursor` is `null` (their pointer left the canvas). Movement is smoothed with a 100ms linear transform transition, since presence arrives about ten times a second.

### Edge Style

Smooth-step path with an arrow marker. Default edge color: `#f8fafc`. Stroke width is thin — edges are visually secondary to nodes.

Implemented as `defaultEdgeOptions` in `lib/canvas-edges.ts` (`type: "smoothstep"`, stroke `EDGE_COLOR` at 1.5px, an `ArrowClosed` end marker in `EDGE_COLOR`, `EDGE_COLOR` in `types/canvas.ts`), passed to `ReactFlow`. React Flow merges them into each edge when drawing, so a template's edges store only their source, target, and handles. An edge drawn by hand is stored with `type`, `markerEnd`, and `style` as well, because React Flow merges the defaults into the connection before `onConnect`; the saved canvas ignores those fields (`lib/canvas-snapshot.ts`). Because the line's color is an inline style, React Flow's own selected color never shows, so `CanvasEdgeRenderer` (`components/editor/canvas-edge.tsx`) draws the selected state itself: the line takes the brand color (`--accent-primary`) at 2.5px with a brand-color glow (`SELECTED_EDGE_STYLE`, `lib/canvas-edges.ts`; the glow also lights the arrow, whose color React Flow fixes in the marker). When an edge is the only selected edge, a 24px round delete button (`X`, `bg-elevated`, `border-surface-border`, `text-copy-secondary`, turns `text-state-error` on hover, label `Delete connection`) sits just to the right of its midpoint (16px from it; 4px from the text when the edge has text) at a constant on-screen size. It is never on the midpoint itself: that is where people double-click to add text, and the first click of that double-click selects the edge and shows the button. Backspace and Delete still remove the whole selection.

Edge text: double-clicking an edge (or its text) edits a short text on it, so a connection can say what it means. The text sits on the edge's midpoint in a pill (`rounded-xl`, `px-2 py-0.5`, `text-xs`, `text-copy-primary` on `bg-base` so the line does not show through, `border-surface-border`, `border-brand` while the edge is selected), at most `max-w-48` wide, wrapping beyond that; it scales with the canvas like a node's text. An edge with no text draws no pill. While editing, the pill becomes a one-line input with a `border-brand` border and the placeholder `Label`, and the delete button is hidden; Enter, Escape, or clicking away keeps the text (emptying it removes it). The delete button stays to the right of the pill (4px away), so it never covers the text.

### Node Shapes

6 supported shapes, defined in `types/canvas.ts` as `NODE_SHAPES`. Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs rather than CSS borders.

- `rectangle` — default general-purpose node
- `diamond` — decision / gateway
- `circle` — event / endpoint
- `pill` — service / process
- `cylinder` — database / storage
- `hexagon` — external system / boundary

`components/editor/canvas-shape.tsx` (`CanvasShape`) draws every shape; the canvas node and the shape drag preview both use it, so a ghost looks exactly like the node it becomes. It fills a `width` x `height` box with the fill from `data.color`, a 1px outline, and the label centered in the largest box that stays inside the outline (`LABEL_INSET`, a CSS `inset` per shape), in the palette's text color (`text-sm`, `whitespace-pre-wrap`, `wrap-anywhere`: line breaks typed into a label are kept). Two optional props serve label editing and are unused by the drag preview: `labelEditor` (shown in place of the label text, in the same box) and `onEditLabel` (called on a double-click of the label box and on a click of the empty-label placeholder; without it the placeholder is plain text, as in the drag ghost). An empty label draws the dimmed `Label` placeholder (see Node Editing).

- CSS shapes: rectangle `rounded-xl`, pill `rounded-full`, circle `rounded-full` (an ellipse if the box is not square), each a bordered `div`.
- SVG shapes: diamond, hexagon, cylinder are one `<svg>` with `viewBox` set to the node's pixel size and `preserveAspectRatio="none"`. The path comes from `getShapePaths(shape, width, height)` in `lib/canvas-shapes.ts`, computed from the node's real size and pulled in by 0.5px so the 1px stroke is not clipped. So they scale with the node and keep a 1px outline at any size and canvas zoom, like the CSS border. Hexagon: flat top and bottom, each slanted side a quarter of the width. Cylinder: top and bottom half-ellipses with `ry` = 15% of the height, plus a second outline-only path for the front lip.
- Outline: `border-surface-border-subtle` (SVG: `stroke-surface-border-subtle`) at rest, `brand` cyan when the node is selected.
- Size: from the node's `width` / `height` (set by the shape panel from the shape's default). React Flow reports `0` for a node that has no size and is not measured yet, so zero counts as missing and the shape's default size is used. A `data.shape` this version does not know draws as a rectangle (`isNodeShape` in `types/canvas.ts`).

### Shape Panel

`components/editor/shape-panel.tsx`: a floating pill-shaped toolbar at the bottom-center of the canvas (a `pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2` wrapper that also holds the color toolbar, see Shape Colors; the panel itself is `pointer-events-auto`, `rounded-full`, `bg-surface/90` + `backdrop-blur-xl`, 1px `border-surface-border-subtle`, `shadow-lg`, `role="toolbar"`). It holds six `ghost` `icon-lg` round buttons, `h-5 w-5` Lucide icons in `text-copy-muted` (hover `text-copy-primary`, `cursor-grab`): rectangle (`RectangleHorizontal`), diamond (`Diamond`), circle (`Circle`), pill (`Pill`), cylinder (`Database`), hexagon (`Hexagon`). Each is `draggable` and carries its shape name plus default size; dropping it on the canvas wrapper creates a node at the drop point (`hooks/use-shape-drop.ts`). Clicking one with a mouse instead selects it and opens its color toolbar (see Shape Colors). Keyboard (Enter / Space) and touch activation cannot drag, so they add the shape at the center of the visible canvas (the node's center on the canvas's center, whatever the pan and zoom) and open the same color toolbar; the toolbar is opened, not toggled, so the press that adds a shape never hides it (Escape or a press elsewhere closes it). Default sizes (`SHAPE_DEFAULT_SIZES` in `types/canvas.ts`): rectangle 160x80, diamond 180x120, circle 96x96, pill 160x64, cylinder 120x100, hexagon 140x100. A new node has an empty label, and draws its shape's current color (see Node Color Palette and Shape Colors).

While a shape is dragged from the panel, `components/editor/shape-drag-preview.tsx` shows a ghost of it: a `CanvasShape` of that shape at its default size and its shape's current color (Shape Colors), `opacity-60`, in a `pointer-events-none fixed z-50` portal to `body` (a portal because the panel's backdrop blur and transform would otherwise offset a fixed child). Its top-left corner follows the cursor, which is where the node's top-left lands on drop, and it is scaled by the canvas zoom so it has the on-screen size the node will have. The browser's own drag image is replaced by a transparent one (`hideNativeDragImage` in `lib/canvas-drag.ts`). The ghost mounts on `dragstart` and unmounts on `dragend`, which fires after a drop and after a cancel.

`components/editor/canvas-node.tsx` is the `canvasNode` renderer: it reads `data` and the size from the synced node and hands them to `CanvasShape`, and adds the resize controls and label editor (see Node Editing) and the connection handles (see below).

### Node Editing

Resize and label editing, both in `components/editor/canvas-node.tsx`.

- Resize: a selected node shows React Flow's `NodeResizer`: four corner handles (`size-2!`, 8px squares) and a 1px line on each side, colored from `--xy-resize-background-color` (`--accent-primary`, set in the `.react-flow` rule in `globals.css`), so they match the cyan selected outline. It renders after `CanvasShape` in the DOM so it paints over the shape (the corner handles sit half inside the node; before this, the shape covered that half and a drag there moved the node). Resizing keeps the aspect ratio (`keepAspectRatio` on `NodeResizer`): the ratio the node has when the drag starts is held, so a drag only scales it, from a corner (the opposite corner stays put) or from a side line (which scales both dimensions). A circle therefore stays a circle, and a node's ratio can no longer be changed. `NODE_MIN_SIZE` (64 x 48, `types/canvas.ts`) is a floor on both sides, so a 2:1 node stops at 96 x 48; there is no maximum. The SVG paths follow the size.
- Label placeholder: a node whose label is empty (or only whitespace) shows `Label` (`NODE_LABEL_PLACEHOLDER` in `types/canvas.ts`) in its label box, in the palette text color at 50% opacity with a text cursor, so it is visible that the node takes text. `CanvasShape` draws it, so the shape drag ghost shows it too. Clicking the placeholder opens the editor; typing replaces it, and clearing the text brings it back. The click does not interfere with dragging: a drag that starts on the placeholder moves the node (React Flow drops the click after a drag), and a click anywhere else on the node only selects it.
- Label editing: click the placeholder of an empty node, or double-click the label box (the same centered box that holds the label, `LABEL_INSET` per shape), to edit. `components/editor/node-label-editor.tsx` (`NodeLabelEditor`) shows a textarea in that box. A textarea cannot center its text vertically, so a hidden copy of the text shares its grid cell: the copy gives the cell the text's height, the label box centers the cell, and the textarea fills it. The textarea is borderless and transparent with `text-center` and the label's inherited font, color, wrapping, and line height, so nothing shifts when editing starts or ends. While the text is empty the textarea shows the same `Label` placeholder in the same spot as the node's own placeholder, so opening the editor does not move or change anything but adding a caret. The caret starts at the end of the text. The label updates as you type; Enter adds a line break; the editor closes on blur or Escape and keeps what was typed (Escape does not revert).
- Text interactions do not move the canvas: the textarea has `nodrag nopan nowheel` (no node drag, pan, or wheel zoom from it), React Flow ignores Backspace and Delete while a text field is focused (the node is not deleted), and a double-click on a node does not zoom the canvas (React Flow adds `nopan` to draggable nodes).

### Shape Colors

A shape's color is chosen in the shape panel and is shared by every node of that shape. There is no per-node color and no color picker: only the 8 predefined pairs.

- Opening: clicking a shape button (a press with no drag; a drag still adds a node) selects it. The selected button gets `bg-subtle` and its icon takes the shape's current text color, `aria-pressed` is set, and `components/editor/shape-color-toolbar.tsx` (`ShapeColorToolbar`) appears directly above the panel, centered on it with an 8px gap, so it never overlaps it. Clicking the same button, another shape's button (the toolbar switches to that shape), pressing Escape, or pressing anywhere outside the panel closes it. Which shape is selected is local UI state, never synced.
- Container: `role="toolbar"` `aria-label="<Shape> color"`, styled like the shape panel (`rounded-full`, `bg-surface/90` + `backdrop-blur-xl`, 1px `border-surface-border-subtle`, `shadow-lg`). The wrapper around the toolbar and the panel is `pointer-events-none` and each child turns it back on, so the empty space beside the narrower one does not swallow canvas clicks and drops.
- Swatches: one `button` per pair in `NODE_COLORS`, `size-6` round, filled with the pair's fill, `color` set to the pair's text color so everything else derives from `currentColor`: a `size-2` dot in the text color at rest, the `Check` icon in its place when active. `title` / `aria-label` is the pair's name; `aria-pressed` marks the active one (the shape's current color).
- Active: a 2px ring in the text color with a 2px gap (`ring-2 ring-current ring-offset-2 ring-offset-surface`) plus the check.
- Hover: a tight glow from the text color, `0 0 6px 1px` at 55% (`hover:shadow-[0_0_6px_1px_color-mix(in_srgb,currentColor_55%,transparent)]`). Keyboard focus shows a `brand` outline.
- Interaction: the toolbar is part of the shape panel, outside the React Flow canvas, so a press on it cannot drag a node or pan the canvas.
- Effect: a pick writes that shape's fill into the room's Storage (`shapeColors`, see `architecture-context.md`), with no server call. Every node of the shape re-renders with the new fill and its paired text color, nodes dropped afterwards start with it, and the drag ghost uses it. The other shapes are untouched.

### Canvas Controls

`components/editor/canvas-controls.tsx` (`CanvasControls`): a floating pill-shaped bar at the bottom-left of the canvas (`absolute bottom-4 left-4 z-20`, one layer above the shape panel's `z-10` so it stays on top if a narrow canvas makes the two overlap). It is styled like the shape panel: `rounded-full`, `bg-surface/90` + `backdrop-blur-xl`, 1px `border-surface-border-subtle`, `shadow-lg`, `p-1.5`, `role="toolbar"` with `aria-label="Canvas controls"`. Three groups of round `ghost` `icon` buttons (`h-5 w-5` Lucide icons, `text-copy-muted`, hover `text-copy-primary`), separated by thin vertical dividers (`role="separator"`, `h-5 w-px bg-surface-border-subtle`):

- Tool: select (`MousePointer2`) and pan (`Hand`), two toggle buttons with `aria-pressed`; the active one gets `bg-subtle text-copy-primary` (like the selected shape in the shape panel). Pan is the starting tool, so dragging empty canvas moves the view as before. The tool is UI state in `Canvas` (never synced) and is applied through `getCanvasToolProps(tool)` in `lib/canvas-tools.ts`; see Selecting below.
- Zoom: zoom out (`ZoomOut`), fit view (`Maximize`), zoom in (`ZoomIn`). They call the React Flow instance (`useReactFlow`) with `ZOOM_ANIMATION` (`lib/canvas-zoom.ts`, a 200ms animation), so the view eases instead of jumping. React Flow's default zoom range applies (0.5 to 2), so zoom in does nothing at 2x.
- History: undo (`Undo2`) and redo (`Redo2`). They are the Liveblocks history handlers (`useUndo` / `useRedo`) that `Canvas` passes in; each button is `disabled` when `useCanUndo` / `useCanRedo` is false, and the shadcn `Button`'s `disabled:opacity-50` dims it. The bar takes `canUndo` / `canRedo` as props instead of calling those hooks, so it needs a `ReactFlowProvider` but no room.

Every button has an `aria-label` and a `title` (`Select: drag to select nodes`, `Pan: drag to move the view`, `Zoom out`, `Fit view`, `Zoom in`, `Undo`, `Redo`). The bar is outside the React Flow DOM (a sibling of `ReactFlow`, like the shape panel), so a press on it cannot drag a node or pan.

Selecting (all React Flow behavior, switched by the tool; props in `lib/canvas-tools.ts`):

- Select tool: dragging on empty canvas draws a selection box instead of panning, and the nodes it touches become the selection (`SelectionMode.Partial`: a node needs only to overlap the box, not sit fully inside it). The edges the box passes through are selected too, even when the box touches neither of an edge's nodes, and so are the edges connected to a selected node; a selected edge is highlighted, and when it is the only one selected it shows its delete button. The view then moves with the middle or right mouse button, or with the left button while Space is held; the wheel and the zoom controls still zoom. React Flow ignores box selection while `panOnDrag` is `true`, which is why select mode narrows it to the middle and right buttons.
- Pan tool: dragging empty canvas moves the view; Shift + drag still draws a selection box, which selects nodes and edges the same way.
- In either tool: a click selects a node, Cmd/Ctrl + click adds or removes one, and clicking empty canvas clears the selection. Dragging any selected node, or the dashed box around a multi-selection, moves all of them together, and an edge between moved nodes follows. Backspace or Delete removes the selected nodes and the edges attached to them (React Flow's default is Backspace only; `deleteKeyCode` adds Delete), through the canvas's `onDelete`, so it syncs and undoes like any other edit. Both keys are ignored while a text field is focused, so editing a label never deletes its node. Selection itself is local: other people do not see what you have selected.
- Each selected node keeps its own outline and resize handles while the group box is drawn around them all.

Keyboard shortcuts (`hooks/use-keyboard-shortcuts.ts`, a `keydown` listener on `window` that `Canvas` mounts): `+` or `=` zoom in, `-` zoom out, Cmd/Ctrl + Z undo, Cmd/Ctrl + Shift + Z and Cmd/Ctrl + Y redo, `A` switches to the select tool (the control bar's Select button lights up) and `H` switches to the hand (pan) tool (the Pan button lights up). Both only change the tool: `A` does not select any nodes, and neither key touches the current selection. The zoom and history keys use the same handlers and animation as the buttons. `+`, `-`, `A`, and `H` are plain keys only: with Cmd/Ctrl or Alt held they are left to the browser (Cmd/Ctrl + `+` / `-` is page zoom, Cmd/Ctrl + `A` selects the page's text), and Alt chords are never handled; Shift is allowed (`+` is Shift + `=` on many keyboards, and Shift or Caps Lock makes the key `A` or `H`). Nothing fires while the target is an `input`, a `textarea`, or editable text (`isContentEditable`), so a node's label editor keeps its own native undo, Backspace, and `-` / `=` / `A` / `H` typing. Handled keys call `preventDefault`.

### Connection Handles

Small white circular handles, hidden by default, revealed on node hover. Appear at all four sides of a node.

Rendered by `canvas-node.tsx`, not by `CanvasShape` (so the drag ghost has none): four React Flow `Handle`s, ids `top`, `right`, `bottom`, `left`, all `type="source"`. With `ConnectionMode.Loose` on the canvas, any handle connects to any other handle, so a node can be wired to any side of any node (the edge's arrow ends where the connection was released). 10px (`size-2.5!`, important because React Flow's stylesheet is unlayered and would otherwise win), `opacity-0` with `group-hover:opacity-100` on a `group` wrapper, so they show while the node or a handle is hovered. Fill and ring come from `--xy-handle-background-color` (`--text-primary`) and `--xy-handle-border-color` (`--bg-base`) in the `.react-flow` rule in `globals.css`. Edges attach to the outer edge of the handle, so a line starts about 5px outside the node.

### Canvas Background

The workspace canvas uses React Flow's `<Background variant={BackgroundVariant.Dots}>` on the base background color, with a `<MiniMap>` bottom-right (React Flow's own "React Flow" attribution link is left visible). The canvas runs with `colorMode="dark"`, and a `.react-flow` rule in `globals.css` points React Flow's `--xy-*` variables at the tokens: background `--bg-base`, dots `--border-subtle`, MiniMap `--bg-surface` with a `--bg-base` 70% mask and `--border-subtle` nodes. Change canvas colors there, not with hex values. React Flow's stylesheet (`@xyflow/react/dist/style.css`) is imported in `components/editor/canvas.tsx`.

The editor home keeps its own grid: `app/editor/page.tsx` renders a `bg-grid` container, a 32px square grid of 1px lines (the `bg-grid` utility in `globals.css`, lines are `--text-primary` at 12% via `color-mix`, a low-saturation white; the earlier `--border-default` lines were too dark to see), with `components/editor/editor-home.tsx` centered on top of it. The workspace no longer uses `bg-grid`, so the grid is not drawn twice.

### Workspace Shell

`/editor/[roomId]` renders `components/editor/workspace-shell.tsx`, full viewport (`h-dvh`):

- Navbar (`EditorNavbar` with `title` and `actions`): project sidebar toggle on the left; the project name centered (`h1`, `text-sm font-medium text-copy-primary`, truncated); on the right an `outline` Save button (`components/editor/canvas-save-button.tsx`, label hidden below `sm`; it is both the manual save and the autosave status: `Save` with the `Save` icon before the first save of the session, `Saving...` with a spinning `LoaderCircle` (button disabled), `Saved` with a `text-state-success` `Check`, `Save failed` with a `text-state-error` `CircleAlert` and the reason as its `title`; pressing it saves right away even if nothing changed, and after a failure it retries; it is disabled while the saved canvas is loading or there is no canvas; a `sr-only` `role="status"` span beside it announces the status, since a button's children are not exposed), an `outline` Templates button (`LayoutTemplate`, label hidden below `sm`, disabled until the canvas has connected) that opens the starter templates modal (see Starter Templates), an `outline` Share button (`Share2`, label hidden below `sm`) that opens the Share dialog, a ghost `icon` AI sidebar toggle (`Sparkles` `h-5 w-5`, `text-ai-text` while open), then the Clerk `UserButton`.
- Left: `ProjectSidebar` with the current room highlighted.
- Center: the canvas area fills everything below the navbar: `CanvasRoom` (`components/editor/canvas-room.tsx`). While the room connects it shows a centered `text-sm` two-line `Loading canvas...` message (`role="status"`, `text-copy-secondary` title, `text-copy-muted` line, on `bg-base`); on a failed connection the same layout shows `Could not connect to the canvas` (`role="alert"`). Once connected it is the React Flow canvas (see Canvas Background). The area is `relative` and also holds the participant group in its top-right corner (see Presence), outside the loading / error / canvas switch, so it is there in all three states.
- Right: `components/editor/ai-sidebar.tsx`, a floating panel that mirrors `ProjectSidebar` (`top-3 right-3 bottom-3`, `w-80` capped at the viewport minus gutters, `rounded-2xl`, `bg-base/95` + `backdrop-blur-xl`, slides in from the right, no scrim). Its header, tabs, chat, and specs are described under AI Sidebar.

### AI Sidebar

`components/editor/ai-sidebar.tsx` (`AiSidebar`, props `isOpen` and `onClose`: `WorkspaceShell` owns the state) is the floating panel on the right. It is UI only for now: no AI, no backend, no room.

- Header: a `size-8` `rounded-xl` tile (`bg-ai/15`, `Bot` `h-4 w-4` in `text-ai-text`), `AI Workspace` (`text-sm font-medium text-copy-primary`) over `Collaborate with Ghost AI` (`text-xs text-copy-muted`), both truncated, and a ghost `icon-sm` close button (`X`) on the right, above a `border-b border-surface-border`.
- Accent: "accent" in the AI sidebar means the AI accent, `bg-ai` / `text-ai-text`, with `/15` for soft fills. Not shadcn's `bg-accent` (that is `--bg-subtle`, a gray) and not the brand cyan, which is only the user's own bubble.
- Tabs: shadcn `Tabs` (`AI Architect`, `Specs`) under the header, in `p-3`. The active trigger is `bg-ai/15` + `text-ai-text`; the inactive one stays `--text-muted`. `TAB_TRIGGER_CLASS` repeats the active colors under `dark:` because the shadcn trigger sets its own `dark:` colors. The AI Architect panel is `keepMounted`, so its conversation and draft survive a tab switch.
- AI Architect (`ai-architect-tab.tsx`): a scrollable area (`overflow-y-auto`, kept scrolled to the newest message) above the input. Before the first message it shows `ai-chat-empty-state.tsx`: a `Bot` icon (`h-8 w-8`, `text-ai-text`), a title and one muted line, and three starter chips (`Design an e-commerce backend`, `Create a chat app architecture`, `Build a CI/CD pipeline`), soft pills: a shadcn `secondary` `sm` `Button` with `rounded-full bg-subtle text-ai-text text-xs`. A chip fills the input and focuses it. Messages (`ai-chat-message.tsx`, `rounded-2xl`, `max-w-[85%]`, `whitespace-pre-wrap wrap-anywhere`): the user's are right-aligned `bg-accent-dim border-2 border-brand/50 text-copy-primary`, the assistant's left-aligned `bg-elevated border border-surface-border text-ai-text`.
- Input (`ai-chat-input.tsx`): a `form` with the shadcn `Textarea` and a send button. The textarea is `min-h-18` (72px) to `max-h-40` (160px), `resize-none`, `field-sizing-fixed`, `text-sm text-copy-primary`, and grows through `useAutoResizeTextarea`; past the maximum it scrolls. Enter sends, Shift+Enter adds a line break, and the Enter that confirms an IME composition does nothing. The send button is a shadcn `icon-lg` `Button` with `bg-ai text-white` (`SendHorizontal`), disabled while the text is blank.
- Specs (`ai-specs-tab.tsx`): a full-width `lg` `Generate Spec` button (`bg-ai text-white`, `FilePlus2`) above the spec cards. A card (`ai-spec-card.tsx`) is `rounded-2xl`, `bg-elevated`, 1px `border-surface-border`, `p-3`: a `size-9` `rounded-xl` `bg-ai/15` tile with `FileText`, the title (`text-sm font-medium text-copy-primary`, wraps), a `Demo spec` line (`text-xs text-copy-muted`), a snippet clamped to three lines (`text-xs text-copy-secondary`), and a disabled ghost `Download` icon button. The list is one hard-coded demo card, and `Generate Spec` does nothing yet.

### Starter Templates

`components/editor/starter-templates-modal.tsx` (`StarterTemplatesModal`), opened from the navbar's Templates button. It is a `DialogShell` widened with its new optional `className` (`sm:max-w-3xl`): title `Starter templates`, description `Start from a ready-made diagram. Importing replaces everything on the current canvas.` (the warning is the only guard: there is no confirmation step, and the replace is one undo step for the person who imported). The body is a `ul` grid, one column and `sm:grid-cols-2`, `gap-4`, `p-1` (so a button's focus ring is not clipped), that scrolls on its own (`max-h-[min(32rem,60dvh)] overflow-y-auto`).

- Card (`li`): `rounded-2xl`, 1px `border-surface-border`, `bg-elevated/60`, `p-3`, `gap-3`: the preview, the name (`h3`, `text-sm font-medium text-copy-primary`), the description (`text-xs text-copy-muted`), and a full-width `outline` `lg` `Import` button (`Import` icon, `aria-label="Import <name>"` so each button is distinct). Clicking it calls `onImport(template)` and then closes the modal.
- Preview (`components/editor/template-preview.tsx`, `TemplatePreview`): one SVG, `viewBox` 320 x 180 (16 padding) so it scales to the card's width, in a `rounded-xl` `border-surface-border` `bg-base` frame; `aria-hidden` because the card carries the name and description. `getPreviewLayout` (`lib/canvas-preview.ts`) takes the bounds from the nodes' positions and sizes and scales and centers them to the largest fit. Edges are drawn first as straight 1px lines between node centers (`EDGE_COLOR` at 50%, no arrowheads); nodes follow with the node's shape and `data.color` as fill and a 1px `stroke-surface-border-subtle` outline: rectangle (radius scaled from the canvas's 12px), pill, and circle as `rect` / `ellipse`, diamond, hexagon, and cylinder from the same `getShapePaths` the canvas uses. No labels, no React Flow instance. It draws each node's own `data.color`, which for a template is its shape's default color, so it shows what an import gives on a canvas that has not recolored that shape.
- Templates (`components/editor/starter-templates.ts`): Microservices, CI/CD Pipeline, Event-Driven System, each 8 to 9 nodes in a left-to-right layout using the shape meanings from Node Shapes (diamond gateway or decision, pill service, cylinder store, hexagon external system, circle start).

### Access Denied

`components/editor/access-denied.tsx`, shown inside `EditorShell` for a room that does not exist or that the user cannot open: centered, a `Lock` icon (`h-8 w-8`, `text-copy-muted`) in a `rounded-2xl` `bg-surface` bordered tile, an `h1` (`text-lg font-semibold`), a `text-sm text-copy-muted` line, and an `outline` `lg` `Back to projects` link to `/editor` (`ArrowLeft`).

### Editor Home

Centered on the grid, no card: `h1` (`text-2xl`, `sm:text-3xl`, `font-semibold`, `text-copy-primary`), a `text-sm text-copy-muted` description, and a `size="lg"` `New Project` button with a `Plus` icon.

## Project Dialogs and Sidebar Items

- Create, Rename, and Delete use `DialogShell`. Create shows a live `Room ID` preview under the name input (`font-mono` `bg-subtle` chip that wraps with `break-all`; `your-project-name` while the name is empty): the name's slug plus a 6-character suffix, e.g. `payments-platform-a1b2c3`, which is both the saved project ID and its Liveblocks room ID; a name with no Latin letters or digits previews `project-<suffix>`. `DialogShell` descriptions use `wrap-anywhere` so a long unbroken project name wraps instead of overflowing the dialog. Rename shows `Current name: <name>` as its description and auto-focuses a prefilled input. Delete has no input, shows the quoted project name in its description, and has a `variant="destructive"` confirm button. Footer buttons are `Cancel` (`outline`) plus the primary action; both are disabled while loading and the primary label switches to `Creating...` / `Renaming...` / `Deleting...`. A failed request keeps the dialog open and shows its message in `components/dialogs/dialog-error.tsx` (`role="alert"`, `text-sm text-state-error`, `wrap-anywhere`) under the form (Create, Rename) or the description (Delete).
- Name inputs go through `components/dialogs/project-name-field.tsx` (label + shadcn `Input` with `text-copy-primary`).
- Share dialog (`components/dialogs/share-dialog.tsx`, on `DialogShell`, opened from the workspace navbar): title `Share project`, description by role. Owners get an `Invite by email` form (email `Input` with `text-copy-primary` + `lg` `Invite` button, `Inviting...` while sending, error under the form). Below it, `Collaborators (n)`: rows with a 32px round avatar (`collaborator-avatar.tsx`: the Clerk image, or the first letter of the name/email on `bg-subtle`), the Clerk name over the email (`text-xs text-copy-muted`), or the email alone when Clerk has no user for it; owners also get a `UserMinus` `ghost` `icon-sm` remove button (`text-copy-muted`, hovers to `text-state-error`). The list scrolls past `max-h-64`; loading, empty, and load-error (with `Try again`) states are plain `text-sm` lines. Collaborators see the same list with no form and no remove buttons. The footer holds `copy-link-button.tsx` (`outline`, `Link2` → `Check` and `Copy link` → `Copied!` for 2 seconds).
- Sidebar project rows: name as a link to `/editor/<id>` (`text-sm text-copy-secondary`, truncated, `hover:text-copy-primary`) with `Pencil` and `Trash2` `ghost` `icon-sm` buttons (`text-copy-muted`, delete hovers to `text-state-error`). The My Projects tab lists owned projects with the buttons; the Shared tab lists projects the user was added to as a collaborator, name only. Both lists come from the server (database), newest first. In a workspace, the current room's row has `bg-accent-dim`, its name `font-medium text-brand`, and `aria-current="page"`; the tabs open on the tab that holds it.
- Below `md` the open sidebar has a `bg-base/70` scrim behind it; tapping the scrim closes the sidebar. From `md` up there is no scrim and the sidebar closes only through its toggle/close buttons.

## Tailwind Token Pitfall

`base` is a color token (`--color-base`), so `text-base` compiles to `color: var(--bg-base)` and sets no font size. Never use `text-base` (or `sm:text-base`) in app code; use `text-sm`, `text-[1rem]`, etc. The protected shadcn `Input` uses `text-base`, so always give it an explicit text color class such as `text-copy-primary`. The shadcn `Textarea` does the same (`text-base md:text-sm`): pass `text-sm` as well as a color, as `AiChatInput` does (tailwind-merge then drops the `text-base`).

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch. shadcn semantic variables (`--background`, `--primary`, `--border`, `--input`, `--ring`, ...) are aliased to the project tokens in `globals.css`, so generated components render in the dark theme without edits. `<html>` carries the `dark` class so `dark:` variants apply.

## Clerk

Clerk components use the `dark` theme from `@clerk/ui/themes`, configured in `lib/clerk-appearance.ts`. Its `variables` are `var(--...)` references to the tokens above — never hex values. Keep Clerk's default user menu and profile flows; do not rebuild them. Auth pages (`components/auth/auth-layout.tsx`): exact 50/50 split at `lg` and up, form only below `lg`; no gradients or feature cards. Left panel (`bg-surface`, `border-r`): compact logo top-left, a large headline (`text-3xl`, `xl:text-4xl`) with an intro paragraph, three features as icon + title + description rows (small `bg-accent-dim` icon tile, no card), and a copyright footer. Right panel (`bg-base`): the Clerk card, centered on both axes and scaled up via `authFormAppearance` in `lib/clerk-appearance.ts` (`fontSize: 1rem`, `spacing: 1.25rem`, width cap `34rem` on `rootBox`, card `margin-inline: auto`) and applied only to `<SignIn>` / `<SignUp>` so the navbar `UserButton` menu keeps its default size. The GitHub / Google buttons get a raised look (`--bg-subtle` fill, 1px `--border-subtle` ring, soft shadow) so they stand out from the card; Clerk draws button outlines as a box-shadow ring, so this is done by replacing `box-shadow` with `!important`. The stacked "Continue with …" buttons and "Last used" badge are Clerk's own behavior for returning users; do not replicate them manually.

## Layout Patterns

- Editor workspace: full-viewport layout — floating sidebar overlay on the left, center canvas, slide-over AI sidebar on the right (see Workspace Shell).
- Sidebars: floating overlay with dark semi-transparent background and subtle border.
- Modals and dialogs: centered overlay, `rounded-3xl`, dark background with backdrop blur.
- Navbar: top bar with dark background and bottom border.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states.
