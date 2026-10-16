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
- Anything that is saved or loaded as a canvas goes through `parseCanvasSnapshot` (`lib/canvas-snapshot.ts`): a request body can be anything and a stored blob outlives the code that wrote it. Save the validated copy, never the request body, and never return a blob URL to the client. Blob calls for the canvas live only in `lib/canvas-storage.ts`.
- Generated specs follow the same split through `lib/spec-storage.ts`, the only place that calls Blob for specs: Markdown in a private blob at `specs/{projectId}/{specId}.md`, only the URL in `ProjectSpec.filePath`. A spec file leaves the server only through `GET /api/projects/[projectId]/specs/[specId]/download`, after `findAccessibleProject` and a lookup of the spec by both its ID and the project's (`findProjectSpec`); never return `filePath` or a blob URL to the client. `GET /api/projects/[projectId]/specs` lists a project's specs (`id`, `filename`, `createdAt` only), and the browser reads a spec's content from the download route with `fetch` (a `fetch` ignores `Content-Disposition`), not from a second content route; both name a spec's file through `specFilename` (`lib/spec-filename.ts`), so they cannot drift. Never forward Blob's `Content-Length` (`get`'s `size`) as a response header: it is `0` when the upstream answer is chunked or compressed, and the browser then reads an empty file. Model-written Markdown is rendered only through `SpecMarkdown` (`react-markdown`, no raw HTML, no images), never with `dangerouslySetInnerHTML`. Anything that deletes a project's data (`DELETE /api/projects/[projectId]`) must remove its spec blobs too, because the rows cascade but the files do not.
- Anything that rewrites a project's canvas from outside the user's own edits (restoring a saved canvas, and later AI generation) must not run while autosave could replace the stored canvas with something older or empty: autosave is enabled only after the load decision (`useCanvasLoad` → `useCanvasAutosave({ enabled })`), and a restore is skipped when the room already has nodes or edges.
- Do not store large generated content directly in the database.
- Task run records are first-class relational data — treat ownership and run IDs as verified before any token issuance.

## Canvas

- Node interactions (resize, label editing) go through React Flow's change flow (`NodeResizer`, `useReactFlow().updateNodeData`), so the Liveblocks `onNodesChange` that the canvas passes to `ReactFlow` receives them. Do not write node state locally or reach into Storage from a node component.
- UI-only state (such as whether the label editor is open) stays in component state and is never synced.
- Inputs inside a node carry `nodrag nopan nowheel` so text interactions do not move the canvas.
- Canvas keyboard shortcuts live in `hooks/use-keyboard-shortcuts.ts` and share their handlers (and `ZOOM_ANIMATION`) with the control bar buttons, so a shortcut and its button cannot drift apart. Any `window`-level key handler must skip editable targets (`input`, `textarea`, `isContentEditable`) so typing, and a text field's own undo, keep working.
- Deleting nodes or edges goes through the `onDelete` the Liveblocks flow hook returns (`onDelete({ nodes, edges })`), never through a `remove` change: `@liveblocks/react-flow`'s `onNodesChange` / `onEdgesChange` ignore `remove`, so a "clear" written that way silently does nothing. Writes that must undo as one step (a template import: delete, then add) go inside one `room.batch`, which nests. A component inside `ReactFlow` that has to delete (the edge's delete button) calls `useReactFlow().deleteElements`, which calls that same `onDelete` prop, rather than receiving the mutation by prop or touching Storage.
- An edge's text is the edge's own `label` (a string), written with `useReactFlow().updateEdge(id, { label })` (a `replace` change into the Liveblocks `onEdgesChange`), never by reaching into Storage. Remove it by writing `label: undefined`, not `""`: Liveblocks' `reconcile` deletes a key set to `undefined`. An inline editor that sits inside an edge (it is a React child of the edge through a portal) stops key events from reaching React Flow's edge handler (`event.stopPropagation()` in its `onKeyDown`), which would otherwise select or deselect the edge as the user types. Anything saved or loaded as a canvas still goes through `parseCanvasSnapshot`, which keeps `label` only as a non-empty string.
- Color belongs to the shape: a node draws `useShapeColors().getColor(shape)` (the room's `shapeColors`, else the shape's default), never its own `data.color`, so all nodes of a shape match. The text color is looked up from `NODE_COLORS` for that fill, never stored beside it. Room data other than the flow goes in the `Storage` declaration in `liveblocks.config.ts`, is read with `useStorage` and written with `useMutation` (in a hook under `hooks/`), and is checked on read because Storage outlives the code.
- Presence (cursors, who is here) goes through Liveblocks presence, never Storage, and is typed in `Presence` in `liveblocks.config.ts`. Positions are sent in canvas coordinates (`screenToFlowPosition`), never screen ones. Presence can update many times a second, so never render from a bare `useOthers()`: list connections with `useOthersConnectionIds()` and read each one with `useOther(connectionId, selector, shallow)`, or map only the fields a component shows with `useOthersMapped(selector, shallow)`. Who the viewer is comes from the Clerk session (`useAuth().userId`), not from the Liveblocks connection: filter `other.id` against it, so the viewer's other tabs are not shown as other people.

## File Organization

- `lib/` — shared infrastructure: Prisma client, auth and project access helpers (`lib/project-access.ts`), project data helpers (`lib/projects.ts`, `lib/collaborators.ts`), Clerk Backend API lookups (`lib/clerk-profiles.ts`), the Liveblocks node client (`lib/liveblocks.ts`) and cursor colors (`lib/cursor-color.ts`; the Liveblocks types live in `liveblocks.config.ts` at the project root), the client-side API wrappers (`lib/project-api.ts`, `lib/collaborator-api.ts`, `lib/canvas-api.ts`, `lib/design-api.ts`, `lib/spec-api.ts`, which share the start-the-run-then-get-a-token flow in `lib/task-run-api.ts`), canvas persistence (`lib/canvas-snapshot.ts` for validating a saved canvas, shared by client and server, `lib/canvas-storage.ts` for Vercel Blob + Prisma, server only), spec persistence (`lib/spec-storage.ts`, the same split for generated specs, server only; the `generate-spec` task calls it too; `lib/spec-filename.ts` is the one place a spec's download filename is built, and `lib/spec-date.ts` formats its creation time for display, client only; `lib/spec-canvas.ts` reduces a Storage snapshot to the graph a spec run takes, client only), canvas helpers that are plain functions (`lib/canvas-drag.ts` for the shape drag payload, `lib/canvas-nodes.ts` for building nodes, `lib/canvas-shapes.ts` for the SVG shape paths, `lib/canvas-edges.ts` for the edge style, `lib/canvas-zoom.ts` for the zoom animation, `lib/canvas-tools.ts` for the select / pan tool's React Flow props, `lib/canvas-selection.ts` for finding the edges a selection box passes through, `lib/canvas-preview.ts` for fitting a template's diagram into its preview), utilities. Mock data used before an API exists lives here and is deleted when the API lands.
- `hooks/` — client-side React hooks that own UI state or interaction logic (e.g. `use-project-actions.ts`, `use-shape-drop.ts`, `use-keyboard-shortcuts.ts`, `use-box-select-edges.ts`, `use-template-import.ts`, `use-cursor-presence.ts`, `use-room-participants.ts`, `use-ai-chat.ts`, `use-ai-chat-feed-ready.ts`, `use-design-run.ts`, `use-project-specs.ts`, `use-spec-content.ts`, `use-spec-run.ts`, `use-auto-resize-textarea.ts`, `use-canvas-load.ts`, `use-canvas-autosave.ts`). Hook files are kebab-case (`use-keyboard-shortcuts.ts` exports `useKeyboardShortcuts`).
- `types/` — shared TypeScript interfaces (e.g. `types/project.ts`).
- `trigger/` — all durable background tasks and AI workflows. The design agent's pure logic lives in `lib/` so it can be read and run without the Trigger.dev runtime: `lib/design-actions.ts` (action schema, validation, and applying an action to the flow), `lib/design-prompt.ts`, `lib/ai-presence.ts`, `lib/ai-status.ts`. The same holds for spec generation: `lib/spec-input.ts` (the Zod schema for the task payload and the `POST /api/ai/spec` body, one definition for both) and `lib/spec-prompt.ts`; the Gemini model list and the 429 check both tasks use are in `lib/ai-models.ts`. A task's run error is readable by whoever holds its run token, so a task logs the real error and throws only a fixed user-facing message (`generate-spec` does; `design-agent` rethrows the original). Anything read from a Liveblocks Feed is validated before it is rendered (`parseAiChatMessage` for `ai-chat`, `parseAiStatusMessage` for `ai-status-feed`, both in `types/tasks.ts`). The browser follows a design run with `useRealtimeRun` (`@trigger.dev/react-hooks`) and a run-scoped public token, and never edits the canvas for it: the task writes to the room and Liveblocks shows it (`hooks/use-design-run.ts`). Anything an AI model returns is validated before it touches the canvas (`parseDesignPlan`), and canvas writes from a task go through `mutateFlow` (`@liveblocks/react-flow/node`), never raw Storage edits.
- `components/` — UI composition only; no business logic.
- `app/api/` — route handlers for auth, triggering, and persistence.
- Name files after the responsibility they contain, not the technology.
