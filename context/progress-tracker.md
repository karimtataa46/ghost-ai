# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation setup

## Current Goal

- 02 Editor chrome: editor navbar, project sidebar shell, dialog pattern (see Completed).

## Completed

- 01 Design System (`feature-spcs/01-design-system.md`): shadcn/ui installed (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/`, unmodified), `lucide-react`, `cn()` in `lib/utils.ts` (clsx + tailwind-merge), dark-only theme tokens in `app/globals.css` with shadcn variables mapped onto them. `tsc` and `next build` pass.

- 02 Editor (`feature-spcs/02-editor.md`): `components/editor/editor-navbar.tsx` (h-14, left/center/right grid, `PanelLeftOpen`/`PanelLeftClose` toggle, right empty; props `isSidebarOpen`, `onToggleSidebar`), `components/editor/project-sidebar.tsx` (absolute floating panel that slides in from the left without pushing content; props `isOpen`, `onClose`; Projects header + close, shadcn Tabs My Projects/Shared with empty states, full-width `New Project` button with `Plus`), `components/dialogs/dialog-shell.tsx` (`DialogShell` with title, optional description, children, optional footer; token-styled, `rounded-3xl`). `tsc`, `eslint`, and `next build` pass; verified via a temporary preview route (removed).

- 02 Editor mounted: `components/editor/editor-shell.tsx` (client component; owns `isSidebarOpen` state, renders `EditorNavbar`, then a `relative` container holding `ProjectSidebar` and `<main>{children}</main>`; `h-dvh` full-viewport) wraps `children` in `app/layout.tsx`. Verified in the browser on `/`: toggle opens/closes the sidebar, the close button works, and page content is not pushed. `tsc`, `eslint`, and `next build` pass.

## In Progress

- None.

## Next Up

- Next feature unit from `feature-spcs/` after 02 is verified.

## Open Questions

- The shadcn CLI (4.21.4) generated `components/ui/*` with `import { cn } from "cn"` (the npm `cn` package) instead of `@/lib/utils`. Resolved with a `"cn": ["./lib/utils"]` path alias in `tsconfig.json` so the generated files stay unmodified. Decide whether to instead rewrite those imports to `@/lib/utils` and drop the alias.

## Architecture Decisions

- `ProjectSidebar` is `absolute` and must be placed inside a `relative` container below the navbar; `EditorShell` owns the `isOpen` state. `New Project` button has no handler yet (dialogs come later).
- `EditorShell` is mounted in the root `app/layout.tsx`, so every route gets the editor chrome. When routes that should not have it (sign-in, project list) are added, move it into a route-group layout (e.g. `app/(editor)/layout.tsx`).
- Dialog pattern is a wrapper (`DialogShell`) over unmodified `components/ui/dialog.tsx`; the shadcn overlay stays default since `components/ui/*` is protected.

- shadcn style is `base-nova` (Base UI primitives, not Radix); triggers use a `render` prop instead of `asChild`.
- Dark only: `<html class="dark">`, tokens defined on `:root` in `globals.css`; shadcn semantic vars (`--background`, `--primary`, `--border`, ...) alias the project tokens.

## Session Notes

- `app/page.tsx` is still the placeholder; layout metadata title is still the create-next-app default.
- `next dev` rewrites the tracked `AGENTS.md` (Next.js agent-rules and agent-feedback blocks) on start. It was restored after the browser check; expect that diff to reappear whenever the dev server runs.
