# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `architecture-context.md`.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Validate unknown external input at system boundaries before trusting it.
- Use `interface` for object contracts. Exception: React Flow node data (`CanvasNodeData` in `types/canvas.ts`) is a `type`, because React Flow requires it to be assignable to `Record<string, unknown>` and an interface is not.

## Next.js

- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity, hooks, or real-time state.
- Keep route handlers focused on a single responsibility.
- Long-running work belongs in background tasks, not in request handlers.

## Styling

- Use CSS custom property tokens defined in `globals.css` — no raw Tailwind color classes like `zinc-*` or hardcoded hex values.
- Reference tokens through their Tailwind utility names: `bg-base`, `text-copy-primary`, `border-surface-border`, `text-brand`, etc.
- Maintain the border radius scale: `rounded-xl` for small elements, `rounded-2xl` for cards, `rounded-3xl` for modals.

## API Routes

- Validate and parse request input before any logic runs.
- Enforce auth and project ownership checks before any mutation.
- Return consistent, predictable response shapes.
- Keep route handlers thin — push complexity into shared modules or background tasks.

## Data and Storage

- Project metadata and relationships belong in PostgreSQL via Prisma.
- Canvas snapshots and generated specs belong in Vercel Blob; Prisma stores only the blob URL reference.
- Do not store large generated content directly in the database.
- Task run records are first-class relational data — treat ownership and run IDs as verified before any token issuance.

## Canvas

- Node interactions (resize, label editing) go through React Flow's change flow (`NodeResizer`, `useReactFlow().updateNodeData`), so the Liveblocks `onNodesChange` that the canvas passes to `ReactFlow` receives them. Do not write node state locally or reach into Storage from a node component.
- UI-only state (such as whether the label editor is open) stays in component state and is never synced.
- Inputs inside a node carry `nodrag nopan nowheel` so text interactions do not move the canvas.
- Canvas keyboard shortcuts live in `hooks/use-keyboard-shortcuts.ts` and share their handlers (and `ZOOM_ANIMATION`) with the control bar buttons, so a shortcut and its button cannot drift apart. Any `window`-level key handler must skip editable targets (`input`, `textarea`, `isContentEditable`) so typing, and a text field's own undo, keep working.
- Deleting nodes or edges goes through the `onDelete` the Liveblocks flow hook returns (`onDelete({ nodes, edges })`), never through a `remove` change: `@liveblocks/react-flow`'s `onNodesChange` / `onEdgesChange` ignore `remove`, so a "clear" written that way silently does nothing. Writes that must undo as one step (a template import: delete, then add) go inside one `room.batch`, which nests.
- Color belongs to the shape: a node draws `useShapeColors().getColor(shape)` (the room's `shapeColors`, else the shape's default), never its own `data.color`, so all nodes of a shape match. The text color is looked up from `NODE_COLORS` for that fill, never stored beside it. Room data other than the flow goes in the `Storage` declaration in `liveblocks.config.ts`, is read with `useStorage` and written with `useMutation` (in a hook under `hooks/`), and is checked on read because Storage outlives the code.

## File Organization

- `lib/` — shared infrastructure: Prisma client, auth and project access helpers (`lib/project-access.ts`), project data helpers (`lib/projects.ts`, `lib/collaborators.ts`), Clerk Backend API lookups (`lib/clerk-profiles.ts`), the Liveblocks node client (`lib/liveblocks.ts`) and cursor colors (`lib/cursor-color.ts`; the Liveblocks types live in `liveblocks.config.ts` at the project root), the client-side API wrappers (`lib/project-api.ts`, `lib/collaborator-api.ts`), canvas helpers that are plain functions (`lib/canvas-drag.ts` for the shape drag payload, `lib/canvas-nodes.ts` for building nodes, `lib/canvas-shapes.ts` for the SVG shape paths, `lib/canvas-edges.ts` for the edge style, `lib/canvas-zoom.ts` for the zoom animation, `lib/canvas-tools.ts` for the select / pan tool's React Flow props, `lib/canvas-preview.ts` for fitting a template's diagram into its preview), utilities. Mock data used before an API exists lives here and is deleted when the API lands.
- `hooks/` — client-side React hooks that own UI state or interaction logic (e.g. `use-project-actions.ts`, `use-shape-drop.ts`, `use-keyboard-shortcuts.ts`, `use-template-import.ts`). Hook files are kebab-case (`use-keyboard-shortcuts.ts` exports `useKeyboardShortcuts`).
- `types/` — shared TypeScript interfaces (e.g. `types/project.ts`).
- `trigger/` — all durable background tasks and AI workflows.
- `components/` — UI composition only; no business logic.
- `app/api/` — route handlers for auth, triggering, and persistence.
- Name files after the responsibility they contain, not the technology.
