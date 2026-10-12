# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema (`prisma/schema.prisma` plus models in `prisma/models/`) and migrations. The generated client is written to `app/generated/prisma` (gitignored) and is used only through `lib/prisma.ts`.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- A project's ID is its Liveblocks room ID: `<slug>-<short suffix>` (lowercase letters, numbers, hyphens, at most 128 characters), built by the client and stored as the primary key through `POST /api/projects { id, name }`. A taken ID is `409`. Without an `id` the schema's cuid default applies.
- Projects can include additional collaborators, identified by email. A user's shared projects are the ones whose collaborators include their verified primary Clerk email (case-insensitive), minus projects they own.
- Only authenticated users can access protected routes.
- `proxy.ts` (not `middleware.ts`) enforces this: every route is protected by default, and only the sign-in and sign-up paths from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` are public (falling back to `/sign-in` and `/sign-up` when a var is unset or empty). Those two vars must stay at `/sign-in` and `/sign-up`, the only auth routes that exist; using a different path requires adding matching pages under `app/` first.
- `/` redirects to `/editor` when signed in and to `/sign-in` otherwise. The editor chrome (`EditorShell`, `WorkspaceShell`) is rendered only under `app/editor/`.
- Identity and project access are checked through `lib/project-access.ts`: `getCurrentUser()` (Clerk user ID + verified primary email) and `findAccessibleProject(projectId, user)` (owner or collaborator, else `null`).
- Unauthenticated requests to `/api/*` get a JSON `401` from `proxy.ts` (not Clerk's redirect or 404), and every handler re-checks the user with `auth()` because it derives `ownerId` from it.
- Renaming or deleting a project itself is owner-only: a signed-in non-owner gets `403` (`lib/projects.ts`, `denyUnlessOwner`). Collaborators do not get these two actions.
- Collaborators are managed through `app/api/projects/[projectId]/collaborators` (`GET` list, `POST { email }` invite) and `.../collaborators/[collaboratorId]` (`DELETE`). The owner and collaborators can list (`findAccessibleProject`, anyone else `404`); only the owner can invite or remove (`denyUnlessOwner`, `403` otherwise). Emails are stored trimmed and lowercased, one row per project and email (`409` for a repeat); the owner cannot invite their own email.
- There is no local user table. Collaborator names and avatars come from the Clerk Backend API at list time (`lib/clerk-profiles.ts`, matched on verified email addresses only); an email with no Clerk user, or a Clerk failure, falls back to showing the email.
- Only the owner or a collaborator can mutate other project resources.
- Liveblocks room tokens are issued only after verifying project membership, by `POST /api/liveblocks-auth` (`app/api/liveblocks-auth/route.ts`). Liveblocks sends `{ room }` (the project ID); the handler checks, in order: signed in (`401`), `room` is a non-empty string (`400`), `findAccessibleProject` passes (`403` for a missing project and for one the user may not open, the same answer for both), then makes sure the room exists (`getOrCreateRoom`, private: `defaultAccesses: []`) and returns an access token from `prepareSession` that allows `["*:write"]` on that one room (owners and collaborators both edit). The session carries `userInfo { name, avatar?, color }`: Clerk name (first + last, else username, else verified email, else `Anonymous`), the uploaded avatar (omitted when none; Liveblocks types `avatar` as a string), and a cursor color from `getCursorColor(userId)`.
- `liveblocks.config.ts` (project root) declares the global `Liveblocks` types: `Presence { cursor: { x, y } | null; isThinking: boolean }` and `UserMeta { id; info { name; avatar?; color } }`. The node SDK and the React hooks both read them, so the token route is type-checked against `UserMeta`. `Storage` is not declared: `useLiveblocksFlow` manages its own `flow` Storage key (a `LiveObject` of `nodes` and `edges` maps), so the canvas needs no declaration. Declare `Storage` here only when something else is stored in the room.
- The server-side Liveblocks client is `getLiveblocks()` in `lib/liveblocks.ts`: created on first use from `LIVEBLOCKS_SECRET_KEY`, cached on `globalThis`, and throws `LIVEBLOCKS_SECRET_KEY is not set` only when called (not at import), so `next build` does not need the secret. Never expose that key client-side.

## Editor Data Flow

- `app/editor/layout.tsx` (server) loads the owned and shared project lists (`lib/projects.ts`) and passes them to `ProjectsProvider`, so the sidebar needs no client-side fetching on load. Each page renders its own shell inside it: `/editor` uses `EditorShell`, `/editor/[roomId]` uses `WorkspaceShell`.
- Mutations go through `hooks/use-project-actions.ts` → `lib/project-api.ts` → `app/api/projects`, then `router.refresh()` re-runs the layout. A navigation alone does not re-render a layout, so creating a project calls `router.push` and `router.refresh()`.
- `/editor` is the home; `/editor/[roomId]` is a project's workspace (the room ID is the project ID). It is a server component: signed out → `redirect("/sign-in")`; a missing project or one the user is neither owner nor collaborator of → `AccessDenied` (same screen for both); otherwise `WorkspaceShell` with the project, whose canvas area is `<CanvasRoom roomId={project.id} />`.
- The canvas (client components, mounted per workspace, not in a layout):
  - `components/editor/canvas-room.tsx` (`CanvasRoom`) sets up the room: `LiveblocksProvider` with `authEndpoint="/api/liveblocks-auth"`, `RoomProvider` for the project ID (keyed by it, so moving between projects starts clean) with initial presence `{ cursor: null, isThinking: false }`, an `ErrorBoundary` (error fallback) around `ClientSideSuspense` (loading state). `ConnectionErrorListener` sits beside the Suspense boundary, not inside it, and forwards `ROOM_CONNECTION_ERROR` to the boundary. That error fires only once the client has given up (auth rejected, no access to the room, room ID changed), not while it retries a dropped connection.
  - `components/editor/canvas.tsx` (`Canvas`) calls `useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true, nodes: { initial: [] }, edges: { initial: [] } })` and passes the synced nodes, edges, and change handlers (`onNodesChange`, `onEdgesChange`, `onConnect`, `onDelete`) to `ReactFlow` with `ConnectionMode.Loose`, `fitView`, `MiniMap`, and a dot `Background`. The hook freezes its options on the first render and only seeds Storage when the room has no flow yet.
  - Adding nodes from the shape panel: `components/editor/shape-panel.tsx` makes six buttons draggable with a `application/x-ghost-shape` payload `{ shape, width, height }` (`lib/canvas-drag.ts`, which also validates it on read). The `Canvas` wrapper `div` takes `onDragOver` / `onDrop` from `hooks/use-shape-drop.ts`: a drop converts the cursor position with React Flow's `screenToFlowPosition` and calls the Liveblocks `onNodesChange` with an `add` change for the node from `createCanvasNode` (`lib/canvas-nodes.ts`: ID `<shape>-<timestamp>-<counter>`, type `canvasNode`, empty label, default color, the shape's width and height). That is how the node reaches the room's Storage; nothing writes React Flow state locally. `useReactFlow` needs a provider, so `Canvas` wraps a private `CanvasSurface` in `ReactFlowProvider`. `canvasNode` is registered through a module-level `nodeTypes` with `CanvasNodeRenderer` (`components/editor/canvas-node.tsx`).
  - Shared canvas types live in `types/canvas.ts`. Not built yet: persistence, controls, shape-specific node visuals and connection handles (every shape renders as a bordered rectangle), the `canvasEdge` renderer (typed, not registered), cursors (`<Cursors />`), AI.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via Trigger.dev.
- Output: structured node and edge updates written into the shared Liveblocks room.

### Spec Generation

- Input: current canvas graph and project context.
- Execution: durable background task via Trigger.dev.
- Output: Markdown technical spec saved to the filesystem and linked to the project in the database.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
