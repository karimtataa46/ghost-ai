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
- Liveblocks room tokens are issued only after verifying project membership.

## Editor Data Flow

- `app/editor/layout.tsx` (server) loads the owned and shared project lists (`lib/projects.ts`) and passes them to `ProjectsProvider`, so the sidebar needs no client-side fetching on load. Each page renders its own shell inside it: `/editor` uses `EditorShell`, `/editor/[roomId]` uses `WorkspaceShell`.
- Mutations go through `hooks/use-project-actions.ts` → `lib/project-api.ts` → `app/api/projects`, then `router.refresh()` re-runs the layout. A navigation alone does not re-render a layout, so creating a project calls `router.push` and `router.refresh()`.
- `/editor` is the home; `/editor/[roomId]` is a project's workspace (the room ID is the project ID). It is a server component: signed out → `redirect("/sign-in")`; a missing project or one the user is neither owner nor collaborator of → `AccessDenied` (same screen for both); otherwise `WorkspaceShell` with the project. The canvas area is a placeholder until the canvas feature.

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
