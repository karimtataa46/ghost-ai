# Ghost AI

**A real-time collaborative system design workspace.** Describe a system in plain English, let an AI agent draw it onto a shared canvas, refine it together with your team, then turn the finished diagram into a Markdown technical specification.

Ghost AI is built with Next.js 16, React Flow, Liveblocks, Trigger.dev, Prisma and Gemini.

---

## Table of Contents

- [What it does](#what-it-does)
- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Data model and storage](#data-model-and-storage)
- [API reference](#api-reference)
- [The canvas](#the-canvas)
- [AI features in depth](#ai-features-in-depth)
- [Security and access model](#security-and-access-model)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Development workflow](#development-workflow)
- [Scope and roadmap](#scope-and-roadmap)

---

## What it does

1. You sign in and create a **project**. Each project is one shared canvas.
2. You invite teammates by email. Everyone edits the same canvas live, with avatars and cursors.
3. You type a prompt such as *"Design an e-commerce backend"* in the AI sidebar. A background AI agent reads the canvas, plans changes, and draws them node by node while everyone watches its cursor move.
4. You and your collaborators refine the diagram by hand: drag shapes, connect them, label them, recolor them.
5. You press **Generate Spec**. The app turns the graph (and the team chat) into a structured Markdown spec, saves it, and lets you preview and download it.

---

## Features

### Projects and collaboration

- Sign-in and sign-up with **Clerk**; every route is protected by default.
- Create, rename and delete projects. Rename and delete are owner-only.
- Share a project by email. Owners invite and remove collaborators; collaborators can open and edit but not rename or delete.
- Two sidebar lists: **My Projects** and **Shared** (projects you were invited to).
- Collaborator names and avatars come from the Clerk Backend API; an email with no Clerk account falls back to showing the email.

### Collaborative canvas

- Real-time shared canvas built on **Liveblocks** and **React Flow**.
- **Six node shapes**: rectangle, diamond (decision/gateway), circle (event/endpoint), pill (service/process), cylinder (database/storage), hexagon (external system).
- Drag shapes from the floating shape panel, or press Enter/Space on one to add it at the center of the view (keyboard and touch friendly).
- Resize nodes (aspect ratio is kept) and edit labels inline.
- **Shape colors**: pick one of 8 predefined color pairs per shape; the choice is shared, so every node of a shape matches for every collaborator.
- Connect any handle to any other; edges are smooth-step with arrowheads. Click to select, delete with a button or Backspace/Delete, double-click to add a short text label.
- Select and pan tools, box selection (nodes and the edges it crosses), multi-node drag and delete.
- Per-user **undo/redo**, zoom controls, fit view, minimap.
- **Live presence**: an avatar stack (up to 5, then `+N`) and named, colored live cursors for everyone else in the room.
- **Autosave**: the canvas is saved to Vercel Blob about 2 seconds after the last change, and restored into a room that starts empty. The navbar Save button shows saving, saved and error states.
- **Starter templates**: import *Microservices*, *CI/CD Pipeline* or *Event-Driven System* at any time. An import replaces the canvas in a single undo step.

### AI sidebar

- **AI Architect tab**: a shared room conversation (a Liveblocks Feed), visible live to everyone with sender and time. Sending a message starts a design run.
- **Design agent**: a durable Trigger.dev task that asks Gemini for a plan and applies it to the shared canvas. It appears as a participant called **Ghost AI**, with its own cursor and a "thinking" spinner. The chat input locks while it works, and a status strip shows its latest progress line.
- **Specs tab**: **Generate Spec** button, a list of the project's saved specs (newest first), a rendered Markdown preview dialog, and download.

---

## Tech stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Cache Components) + React 19 + TypeScript (strict) | Full-stack app with server/client boundaries |
| UI | Tailwind CSS 4 + shadcn/ui (`base-nova` style, Base UI primitives) + Lucide icons | Dark-only design system built on CSS custom property tokens |
| Auth | Clerk | Identity, sign-in/sign-up, route protection |
| Database | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) | Projects, collaborators, spec records, task runs |
| Canvas | Liveblocks (`@liveblocks/react-flow`) + React Flow (`@xyflow/react`) | Real-time storage, presence, cursors, feeds |
| Background jobs | Trigger.dev v4 | Durable AI design and spec generation |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/google`) + Google Gemini | Structured design plans and Markdown specs |
| Artifact storage | Vercel Blob (private) | Canvas snapshots and generated Markdown specs |
| Validation | Zod | Request bodies, task payloads, feed messages |
| Markdown | `react-markdown` + `remark-gfm` | Safe spec preview |

---

## How it works

### The AI design flow

```
 Browser (user types a prompt)
    │  1. POST /api/ai/design  { prompt, roomId, projectId }
    ▼
 Your Next.js API route
    │  checks Clerk login + project access (Prisma / Postgres)
    │  2. uses TRIGGER_SECRET_KEY to say "start design-agent"
    │  3. saves a TaskRun row (who started which run)
    │  returns { runId } straight away
    ▼
 Trigger.dev  (runs the job in the background)
    │  design-agent task
    │
    ├─ 4. Liveblocks: read the current canvas
    │       (LIVEBLOCKS_SECRET_KEY)
    ├─ 5. Gemini: "turn this prompt into a list of actions"
    │       (GOOGLE_AI_API_KEY)
    └─ 6. Liveblocks: apply each action, set the AI's cursor,
            post status lines
                │
                ▼
          Liveblocks room (the shared canvas)
                │  pushes changes live over WebSocket
                ▼
          Everyone's browser: nodes appear, "Ghost AI" cursor moves
```

The browser never edits the canvas for an AI run. It only follows the run's progress (Trigger.dev realtime hooks with a run-scoped token) while the task writes straight to the Liveblocks room, and Liveblocks shows the result to everyone.

### The spec flow

```
 Browser (Generate Spec)
    │  reads the canvas + chat once, at click time
    │  POST /api/ai/spec  { roomId, chatHistory, nodes, edges }
    ▼
 Next.js API route ──► checks login + access, triggers generate-spec,
    │                  stores a TaskRun, returns { runId }
    ▼
 Trigger.dev  generate-spec task
    ├─ builds a prompt from the diagram + chat
    ├─ Gemini writes the Markdown spec
    ├─ uploads it to Vercel Blob   specs/{projectId}/{specId}.md
    └─ inserts a ProjectSpec row (metadata + blob URL)
                │
                ▼
 Browser follows run metadata → the new spec appears in the Specs tab
 Preview and download go through GET .../specs/{specId}/download
```

### System boundaries

| Directory | Responsibility |
| --- | --- |
| `app/api` | Authenticated request handlers: validate input, check ownership, trigger tasks, persist. No long-running work. |
| `trigger` | Durable background jobs: AI design generation and spec generation. |
| `lib` | Shared infrastructure: Prisma client, access control, storage helpers, pure AI logic. |
| `components` | UI composition: canvas surfaces, sidebars, dialogs. |
| `hooks` | Client-side hooks that own UI state or interaction logic. |
| `prisma` | Schema (split into `prisma/models/`) and migrations. |

### Where data lives

| Data | Where | Why |
| --- | --- | --- |
| Projects, collaborators, spec records, task runs | PostgreSQL (Prisma) | Relational metadata and ownership |
| Live canvas, shape colors, cursors | Liveblocks room (Storage + presence) | Source of truth while people are editing |
| Canvas snapshot `canvas/{projectId}.json` | Vercel Blob (private) | Restores an empty room; stable copy for AI reads |
| Spec Markdown `specs/{projectId}/{specId}.md` | Vercel Blob (private) | Large generated artifacts stay out of the database |
| AI chat and AI status lines | Liveblocks Feeds (`ai-chat`, `ai-status-feed`) | Shared with everyone in the room |

The database stores only the blob **URL** (`Project.canvasJsonPath`, `ProjectSpec.filePath`). Blob URLs are never sent to the browser; files are streamed through access-checked routes.

---

## Getting started

### Prerequisites

- **Node.js** 20.19+, 22.12+ or 24+ (required by Prisma 7 and Next.js 16)
- **npm**
- A **PostgreSQL** database (any provider; hosted Prisma Postgres also works)
- Accounts for: [Clerk](https://clerk.com), [Liveblocks](https://liveblocks.io), [Trigger.dev](https://trigger.dev), [Vercel Blob](https://vercel.com/docs/vercel-blob) and [Google AI Studio](https://aistudio.google.com) (Gemini API key)

### 1. Clone and install

```bash
git clone https://github.com/karimtataa46/ghost-ai.git
cd ghost-ai
npm install        # also runs `prisma generate` via postinstall
```

### 2. Create the external services

| Service | What to create |
| --- | --- |
| **Clerk** | An application. Keep the sign-in and sign-up URLs at `/sign-in` and `/sign-up`; those are the only auth pages the app has. |
| **Liveblocks** | A project. Only the **secret key** is used; rooms are authorized by the app's own `/api/liveblocks-auth` endpoint. |
| **Vercel Blob** | A **private** store. The code uploads with `access: "private"`, and a public store rejects private uploads (and the reverse). |
| **Trigger.dev** | A project. Then replace the `project` ref in [trigger.config.ts](trigger.config.ts) with your own. |
| **Google AI Studio** | A Gemini API key. |

### 3. Configure environment variables

Create `.env` and `.env.local` (both are gitignored). See [Environment variables](#environment-variables) for the full list.

Put `DATABASE_URL` in **`.env`**: the Prisma CLI reads `.env` (through `dotenv/config` in [prisma7.config.ts](prisma7.config.ts)) and Next.js loads it too. Put everything else in **`.env.local`**.

### 4. Set up the database

```bash
npx prisma migrate deploy      # applies the migrations in prisma/migrations
npx prisma generate            # writes the client to app/generated/prisma (gitignored)
```

For schema work during development use `npx prisma migrate dev`. The Prisma CLI loads `prisma7.config.ts` automatically; no `--config` flag is needed.

### 5. Run it

You need **two processes**, because AI work runs in Trigger.dev rather than in the Next.js server:

```bash
# Terminal 1: the web app
npm run dev

# Terminal 2: the Trigger.dev dev worker (use the same version as @trigger.dev/sdk)
npx trigger.dev@4.7.4 dev
```

Open [http://localhost:3000](http://localhost:3000). Signed-out visitors are sent to `/sign-in`; signed-in users land on `/editor`.

> Without the Trigger.dev worker running, design and spec runs stay queued forever and the sidebar keeps showing "Ghost AI is working...".

---

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Next.js, Prisma CLI, `generate-spec` task | PostgreSQL connection string. `prisma://` and `prisma+postgres://` URLs use Prisma Accelerate; anything else uses the `pg` adapter. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Next.js | Clerk publishable key |
| `CLERK_SECRET_KEY` | Next.js (server only) | Clerk secret key; also used to look up collaborator profiles |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Next.js | Must be `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Next.js | Must be `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Next.js | Where to go after sign-in (`/`, which redirects to `/editor`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Next.js | Where to go after sign-up (`/`) |
| `LIVEBLOCKS_SECRET_KEY` | Next.js, `design-agent` task | Issues room tokens, deletes rooms, lets the agent write to the canvas. Never expose client-side. |
| `BLOB_READ_WRITE_TOKEN` | Next.js, `generate-spec` task | Read/write token for the **private** Vercel Blob store |
| `TRIGGER_SECRET_KEY` | Next.js | Lets the API routes trigger tasks and mint run-scoped tokens (use the `tr_dev_…` key locally, `tr_prod_…` in production) |
| `GOOGLE_AI_API_KEY` | `design-agent` and `generate-spec` tasks | Gemini API key |

Deployed Trigger.dev tasks read **their own** environment, not Vercel's. See [Deployment](#deployment) for which variables each side needs.

Some variables are read implicitly by their SDKs (`CLERK_SECRET_KEY`, `BLOB_READ_WRITE_TOKEN`, `TRIGGER_SECRET_KEY`) rather than by app code, so a missing value shows up as an SDK error at the first request that needs it. `LIVEBLOCKS_SECRET_KEY` and `DATABASE_URL` are read lazily on first use so `next build` and the Trigger.dev indexer work without them.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | `prisma generate && next build` |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint (`eslint-config-next`, core-web-vitals + TypeScript) |
| `npx prisma migrate deploy` | Apply migrations |
| `npx prisma migrate dev` | Create and apply a migration during development |
| `npx prisma studio` | Browse the database |
| `npx trigger.dev@4.7.4 dev` | Run the Trigger.dev dev worker |
| `npx trigger.dev@4.7.4 deploy` | Deploy the background tasks |

There is no test runner configured. Type-check with `npx tsc --noEmit`.

---

## Project structure

```
ghost-ai/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── design/            POST start a design run (+ token/)
│   │   │   └── spec/              POST start a spec run   (+ token/)
│   │   ├── liveblocks-auth/       POST issue a Liveblocks room token
│   │   └── projects/
│   │       ├── route.ts           GET list, POST create
│   │       └── [projectId]/
│   │           ├── route.ts       PATCH rename, DELETE
│   │           ├── canvas/        GET / PUT saved canvas
│   │           ├── collaborators/ GET / POST, [collaboratorId] DELETE
│   │           └── specs/         GET list, [specId]/download GET
│   ├── editor/
│   │   ├── layout.tsx             loads project lists, mounts ProjectsProvider
│   │   ├── page.tsx               editor home
│   │   └── [roomId]/page.tsx      a project's workspace
│   ├── sign-in/  sign-up/         Clerk pages
│   └── generated/prisma/          generated client (gitignored)
├── components/
│   ├── auth/                      two-panel sign-in/up layout
│   ├── dialogs/                   create, rename, delete, share dialogs
│   ├── editor/                    canvas, shape panel, AI sidebar, shells, templates
│   └── ui/                        shadcn/ui components (unmodified)
├── hooks/                         use-ai-chat, use-design-run, use-spec-run, use-canvas-autosave, ...
├── lib/                           access control, storage, AI logic, API clients, canvas helpers
├── prisma/
│   ├── schema.prisma              generator + datasource
│   ├── models/                    project, project-spec, task-run
│   └── migrations/
├── trigger/
│   ├── design-agent.ts            prompt → canvas changes
│   └── generate-spec.ts           canvas + chat → Markdown spec
├── types/                         canvas, tasks, ai-chat, project, spec, presence, collaborator
├── context/                       product, architecture and workflow docs (see below)
├── liveblocks.config.ts           global Liveblocks types (Presence, Storage, UserMeta)
├── proxy.ts                       Clerk route protection (Next.js 16 replacement for middleware.ts)
├── trigger.config.ts              Trigger.dev project config
└── prisma7.config.ts              Prisma CLI config
```

---

## Data model and storage

Four Prisma models, defined in `prisma/models/`:

```
Project            id (also the Liveblocks room ID), ownerId (Clerk user ID), name, description?,
                   status (DRAFT | ARCHIVED | DELETING), canvasJsonPath? (blob URL), timestamps
ProjectCollaborator   projectId, email (trimmed, lowercased), createdAt   — unique (projectId, email)
ProjectSpec        projectId, filePath (blob URL), createdAt              — one row per generation
TaskRun            runId (unique Trigger.dev run ID), projectId, userId, createdAt
```

Key rules:

- **Project ID = room ID.** The client builds it as `<slug>-<6-char suffix>` (for example `payments-platform-a1b2c3`) and `POST /api/projects` stores it as the primary key. A taken ID returns `409`.
- **There is no local user table.** Owners are Clerk user IDs. Collaborators are identified by verified email; a user's shared projects are those whose collaborators include their verified primary Clerk email.
- **Everything cascades** from `Project` in the database, but blob files do not, so deleting a project also removes its canvas blob and every spec blob.
- **`TaskRun` gates access.** A run ID alone never grants anything; a token is issued only for a run the requesting user started.

---

## API reference

All routes require a signed-in user. Unauthenticated `/api/*` requests get a JSON `401` from `proxy.ts`, and every handler re-checks the user itself. Errors use one shape: `{ "error": "message" }`.

### Projects and collaborators

| Method | Route | Description | Who |
| --- | --- | --- | --- |
| `GET` | `/api/projects` | List projects you own | Signed in |
| `POST` | `/api/projects` | Create `{ id?, name }` → `201`; `409` if the ID exists | Signed in |
| `PATCH` | `/api/projects/[projectId]` | Rename `{ name }` | Owner |
| `DELETE` | `/api/projects/[projectId]` | Delete: mark `DELETING` → delete Liveblocks room → delete row → delete canvas and spec blobs. Retryable if a later step fails. | Owner |
| `GET` | `/api/projects/[projectId]/collaborators` | List collaborators with Clerk names and avatars | Owner, collaborator |
| `POST` | `/api/projects/[projectId]/collaborators` | Invite `{ email }`; `409` for a repeat | Owner |
| `DELETE` | `/api/projects/[projectId]/collaborators/[collaboratorId]` | Remove a collaborator | Owner |

### Canvas and realtime

| Method | Route | Description | Who |
| --- | --- | --- | --- |
| `GET` | `/api/projects/[projectId]/canvas` | `{ canvas: { nodes, edges } }`, or `{ canvas: null }` if never saved | Owner, collaborator |
| `PUT` | `/api/projects/[projectId]/canvas` | Save `{ nodes, edges }` (validated by `parseCanvasSnapshot`; unknown fields are dropped) | Owner, collaborator |
| `POST` | `/api/liveblocks-auth` | Issue a room access token for `{ room }` after checking membership; creates the private room if needed | Owner, collaborator |

### AI and specs

| Method | Route | Description | Who |
| --- | --- | --- | --- |
| `POST` | `/api/ai/design` | `{ prompt, roomId, projectId }` → `202 { runId }`. Prompt is 1–4000 characters. | Owner, collaborator |
| `POST` | `/api/ai/design/token` | `{ runId }` → `{ token }`, a 1-hour Trigger.dev token that can read only that run | Run's starter |
| `POST` | `/api/ai/spec` | `{ roomId, chatHistory, nodes, edges }` → `202 { runId }`. 1–200 nodes, up to 400 edges. | Owner, collaborator |
| `POST` | `/api/ai/spec/token` | `{ runId }` → `{ token }` | Run's starter |
| `GET` | `/api/projects/[projectId]/specs` | `{ specs: [{ id, filename, createdAt }] }`, newest first, capped at 100 | Owner, collaborator |
| `GET` | `/api/projects/[projectId]/specs/[specId]/download` | Streams the Markdown as an attachment (`<project-slug>-spec-<yyyy-mm-dd>.md`) | Owner, collaborator |

Access failures deliberately give one answer for a missing project, a project being deleted, and a project you may not open, so a project ID's existence is not revealed: the AI, spec and `liveblocks-auth` routes return `403`, and the canvas and collaborator-list routes return `404`. Non-owners calling an owner-only route get `403`.

---

## The canvas

### Shapes and colors

| Shape | Meaning | Default color | Default size |
| --- | --- | --- | --- |
| Rectangle | General component | Blue | 160 × 80 |
| Diamond | Decision / gateway | Orange | 180 × 120 |
| Circle | Event / endpoint | Green | 96 × 96 |
| Pill | Service / process | Purple | 160 × 64 |
| Cylinder | Database / storage | Teal | 120 × 100 |
| Hexagon | External system / boundary | Pink | 140 × 100 |

The palette has 8 fill/text pairs: Neutral, Blue, Purple, Orange, Red, Pink, Green, Teal. Color belongs to the **shape**, not the node, and is stored in the room as `shapeColors`, so recoloring a shape recolors all its nodes for everyone.

### Controls and shortcuts

| Action | Input |
| --- | --- |
| Select tool / Pan (hand) tool | `A` / `H`, or the control bar |
| Zoom in / zoom out | `+` or `=` / `-` |
| Undo | `Cmd/Ctrl + Z` |
| Redo | `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` |
| Delete selection | `Backspace` or `Delete` |
| Add or remove from selection | `Cmd/Ctrl + click` |
| Box select while panning | `Shift + drag` |
| Edit a node label | Click the `Label` placeholder, or double-click the label |
| Edit an edge label | Double-click the edge |

Shortcuts never fire while you are typing in an input, textarea or editable text. Undo and redo are per-user Liveblocks history, so they reverse only your own changes.

### Persistence

Autosave debounces 2 seconds after the last change from anyone in the room, serializes the canvas, and uploads it only if it differs from the last saved copy. It stays disabled until the initial load decision has finished, so it can never overwrite a saved canvas with the empty one the editor starts with. A saved canvas is restored only into a room that is still empty.

---

## AI features in depth

### Design agent (`trigger/design-agent.ts`)

1. Starts the AI's presence (`Ghost AI`, `thinking: true`) and posts a status line.
2. Reads the canvas from the room.
3. Asks Gemini for a plan: `{ summary, actions }`.
4. Validates every action, then applies them one at a time so collaborators watch the diagram grow, moving the AI cursor to each node it touches.
5. Posts a final `complete` (or `error`) status and clears presence, even on failure.

**Actions the model can propose:** `add_node`, `move_node`, `resize_node`, `update_node`, `delete_node`, `add_edge`, `delete_edge`. They are applied in a fixed order (removals, changes to existing items, new nodes, new edges) so an edge always has its nodes.

**The model's output is treated as untrusted input.** Rules enforced in code regardless of what it returns:

- Only the six node shapes; colors come from the shape's palette default (the model does not choose colors).
- Sizes are clamped between the minimum and 400; positions snap to a 20px grid and nodes never sit within 60px of each other.
- Edge handles are chosen from the nodes' relative positions; an edge needs two existing nodes and duplicate connections are skipped.
- A malformed action is dropped and counted, at most 80 actions run, and an action that doesn't fit the current canvas is skipped with a logged reason.
- Every edge gets a one-to-three-word label.

### Spec generation (`trigger/generate-spec.ts`)

The canvas is reduced to what a spec needs (component labels and shapes, connections and their text), plus the newest 30 chat messages. The prompt describes each component with who it sends to and receives from, computed in code because models misread arrow direction from a flat list. The diagram and chat are treated as material to describe, never as instructions.

The generated document always follows this outline:

1. Title
2. Overview
3. Goals and Assumptions
4. Architecture (component table)
5. Data Flow
6. Component Details
7. Data Storage
8. External Integrations
9. Non-Functional Requirements
10. Risks and Open Questions

Details the diagram doesn't give are written as sentences beginning `Assumption:`. If the diagram and chat disagree, the diagram wins.

### Models and rate limits

Both tasks try Gemini models in order and fall back only when one fails: `gemini-flash-latest` → `gemini-3.5-flash` → `gemini-3.5-flash-lite` (see [lib/ai-models.ts](lib/ai-models.ts)). SDK retries are off, because a daily-quota `429` cannot be retried away and each model has its own quota. If every model returns `429`, the run fails with *"The AI service has reached its usage limit. Try again later."* The Gemini free tier allows a small number of requests per day per model.

### Failure behavior

- Tasks run once (`retry.maxAttempts: 1`): applying a plan is not idempotent, so a retry would draw everything twice.
- Only deliberate, user-safe messages reach the room or the run's metadata. Provider errors are logged in full on the server and shown as a generic line.
- A failure partway through leaves the applied changes on the canvas and reports *"Stopped after N of M changes."*
- AI changes are written straight to the room, outside any user's undo history.

---

## Security and access model

- **Routes are protected by default** in `proxy.ts`; only `/sign-in` and `/sign-up` are public.
- **Ownership is enforced at every mutation boundary.** `findAccessibleProject` (owner or collaborator) gates reads and edits; `denyUnlessOwner` gates rename, delete and collaborator management.
- **Liveblocks rooms are private.** Tokens are issued only after a membership check, scoped to one room, and a project marked `DELETING` can no longer get a token, so a deleted room cannot be re-created by a late request.
- **Deleting a project deletes its Liveblocks room.** The project ID is the room ID and the client chooses it, so a surviving room could otherwise be claimed by whoever re-creates the ID.
- **Blob files are private** and leave the server only through access-checked routes. Blob URLs are never returned to the client.
- **All untrusted input is validated before use:** request bodies, saved canvases (a stored blob outlives the code that wrote it), AI plans, and anything read from a Liveblocks Feed (anyone with write access to a room can write to a feed).
- **Model-written Markdown** is rendered only through `react-markdown` with no raw HTML and no images, never `dangerouslySetInnerHTML`.
- **Run tokens are scoped:** a Trigger.dev public token can read only the one run it was minted for, expires in an hour, and is issued only to the user who started that run.
- **Known limitation:** removing a collaborator does not end a session that already holds a room token; only the next token request is refused.

---

## Deployment

Ghost AI deploys as **two separate pieces**, and both must be deployed.

### 1. The Next.js app (for example on Vercel)

- Build command: `npm run build` (runs `prisma generate` first).
- Set these environment variables: `DATABASE_URL`, the Clerk variables, `LIVEBLOCKS_SECRET_KEY`, `BLOB_READ_WRITE_TOKEN`, and a **production** `TRIGGER_SECRET_KEY`.
- Run `npx prisma migrate deploy` against the production database.

### 2. The background tasks (Trigger.dev)

A Next.js deploy ships only the web app. The tasks in `trigger/` are a separate step:

```bash
npx trigger.dev@4.7.4 deploy     # keep the CLI version in step with @trigger.dev/sdk
```

Run it again whenever `trigger/` or anything it imports changes. The deployed tasks read **their own** environment, so set these in the Trigger.dev dashboard for the Production environment:

| Task | Needs |
| --- | --- |
| `design-agent` | `GOOGLE_AI_API_KEY`, `LIVEBLOCKS_SECRET_KEY` |
| `generate-spec` | `GOOGLE_AI_API_KEY`, `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN` |

Connecting the Trigger.dev GitHub integration runs the deploy on every push.

---

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| A run sits at **Pending version** or "Ghost AI is working..." forever | Locally: the `trigger dev` worker isn't running. In production: the tasks were never deployed to that Trigger.dev environment. |
| Design run fails with `LIVEBLOCKS_SECRET_KEY is not set` (or `GOOGLE_AI_API_KEY` missing) | The Trigger.dev environment is missing its own variables. Vercel's variables don't reach tasks. |
| Save button says **Save failed** / "Access denied" | Check `BLOB_READ_WRITE_TOKEN` parses to a value starting with `vercel_blob_rw_` (a mis-quoted line in `.env.local` truncates it), and that the Blob store is **private**. |
| "The AI service has reached its usage limit" | Every Gemini model returned `429`. A daily quota won't clear for hours; use a key with more quota. |
| `npm run dev` or `tsc` fails right after cloning | The Prisma client hasn't been generated. Run `npx prisma generate` (`npm install` does this through `postinstall`). |
| `prisma.<model>` is undefined after a schema change in dev | Run `npx prisma generate`; the dev client cache refreshes itself when the generated model set changes. |
| Redirected to Clerk's hosted page instead of `/sign-in` | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` aren't set to `/sign-in` and `/sign-up`. |
| A project shows as unavailable after a failed delete | It is left in `DELETING` when a later delete step fails. The owner can simply retry the delete. |
| `next dev` modifies `AGENTS.md` | Expected: Next.js rewrites its agent-rules block on start. |

---

## Development workflow

This project is built **spec-first**. The `context/` directory is the source of truth for what to build and how:

| File | Contents |
| --- | --- |
| `context/project-overview.md` | Product definition, goals, features, scope |
| `context/architecture-context.md` | System structure, boundaries, storage model, invariants |
| `context/ui-context.md` | Theme, colors, typography, component conventions |
| `context/code-standards.md` | Implementation rules and conventions |
| `context/ai-workflow-rules.md` | Scoping rules and delivery approach |
| `context/progress-tracker.md` | Completed work, open questions, next steps |
| `context/feature-spcs/` | Numbered feature specs, from `01-design-system` to `29-spec-ui-integration` |

[CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) point AI coding assistants at these files. Next.js 16 has breaking changes from earlier versions, so check `node_modules/next/dist/docs/` before relying on remembered APIs.

### Conventions worth knowing

- **TypeScript strict**; avoid `any`; validate unknown input at system boundaries.
- **Server Components by default.** `"use client"` only for browser interactivity or realtime state.
- **Tokens, not colors.** Dark-only theme defined as CSS custom properties in `app/globals.css`; no hardcoded hex values or raw Tailwind palette classes like `zinc-*`. Radius scale: `rounded-xl` small, `rounded-2xl` cards, `rounded-3xl` modals.
- **`components/ui/*` is protected.** shadcn components stay unmodified; project-specific styling goes in app-level components.
- **Long-running work belongs in `trigger/`**, never in request handlers.
- **Canvas writes go through Liveblocks' change flow** (`onNodesChange`, `onEdgesChange`, `onDelete`), never directly into Storage. Deleting uses `onDelete`, because `remove` changes are ignored by `@liveblocks/react-flow`.
- **Presence goes through Liveblocks presence, not Storage**, in canvas coordinates. Never render from a bare `useOthers()`.
- **Never use Tailwind's `text-base`** in app code: `base` is a color token here (`--bg-base`), so it sets a color instead of a font size.
- **Prisma:** the generated client is used only through `lib/prisma.ts` (created lazily on first use).

---

## Scope and roadmap

### In scope (built)

Authentication and route protection · projects, ownership and email collaborators · starter templates · real-time shared canvas with presence · canvas autosave and restore · AI design generation from prompts · AI spec generation from the canvas · persistent Markdown specs with preview and download.

### Not built yet

- A full color picker (only the 8 predefined pairs exist)
- A custom edge type beyond the smooth-step default
- Importing a template at project-creation time (importing from inside the editor works)
- Showing a running spec generation to other collaborators, and a way to cancel or time out a run

### Out of scope

Billing and subscriptions · permission tiers beyond owner and collaborator · versioned spec history and review workflows · production object-storage migration · mobile-native apps.

---

## Contributing and license

Work one feature unit at a time, against the specs in `context/`, and check a change end to end before moving on. No license file has been added to this repository yet, so all rights are reserved by default until one is.
