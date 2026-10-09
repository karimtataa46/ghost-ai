# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation setup

## Current Goal

- None active. 03 Auth is implemented and verified (see Completed); pick the next feature unit from `feature-spcs/`.

## Completed

- 01 Design System (`feature-spcs/01-design-system.md`): shadcn/ui installed (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/`, unmodified), `lucide-react`, `cn()` in `lib/utils.ts` (clsx + tailwind-merge), dark-only theme tokens in `app/globals.css` with shadcn variables mapped onto them. `tsc` and `next build` pass.

- 02 Editor (`feature-spcs/02-editor.md`): `components/editor/editor-navbar.tsx` (h-14, left/center/right grid, `PanelLeftOpen`/`PanelLeftClose` toggle, right empty; props `isSidebarOpen`, `onToggleSidebar`), `components/editor/project-sidebar.tsx` (absolute floating panel that slides in from the left without pushing content; props `isOpen`, `onClose`; Projects header + close, shadcn Tabs My Projects/Shared with empty states, full-width `New Project` button with `Plus`), `components/dialogs/dialog-shell.tsx` (`DialogShell` with title, optional description, children, optional footer; token-styled, `rounded-3xl`). `tsc`, `eslint`, and `next build` pass; verified via a temporary preview route (removed).

- 02 Editor mounted: `components/editor/editor-shell.tsx` (client component; owns `isSidebarOpen` state, renders `EditorNavbar`, then a `relative` container holding `ProjectSidebar` and `<main>{children}</main>`; `h-dvh` full-viewport) wraps `children` in `app/layout.tsx` (since moved to `app/editor/layout.tsx` by 03 Auth). Verified in the browser on `/`: toggle opens/closes the sidebar, the close button works, and page content is not pushed. `tsc`, `eslint`, and `next build` pass.

- Clerk auth setup: Clerk CLI 3.4.1 installed globally; `clerk init --app app_3KSW8GYWHeYlUVewSrD03oWRqCM` added `@clerk/nextjs` (7.9.13), `proxy.ts` (`clerkMiddleware()`, matcher includes `'/__clerk/:path*'` after `'/(api|trpc)(.*)'`), `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, and dev keys in `.env.local` (gitignored). `@clerk/ui` added. (The initial `shadcn` Clerk theme, its CSS import, and the signed-out navbar buttons were replaced by 03 Auth.)

- 03 Auth (`feature-spcs/03-auth.md`):
  - `lib/clerk-appearance.ts`: Clerk's `dark` theme from `@clerk/ui/themes` as base, with `variables` set to `var(--...)` strings pointing at the `globals.css` tokens (no hardcoded colors). `ClerkProvider` in `app/layout.tsx` takes it; the `shadcn` theme and the `@clerk/ui/themes/shadcn.css` import in `globals.css` were removed.
  - `proxy.ts`: `clerkMiddleware` + `createRouteMatcher`. Public routes are built from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (with `(.*)`); everything else calls `auth.protect()`. Matcher unchanged.
  - `components/auth/auth-layout.tsx` (server component): 50/50 `lg:grid-cols-2` (left: cyan `Ghost` logo tile + "Ghost AI", large headline, intro paragraph, three icon + title + description feature rows from the project overview, copyright footer; right: centered, enlarged Clerk form), form only below `lg`. Redesigned to match a reference screenshot from the user, which supersedes the spec's "text-only feature list" wording. Form slot is wrapped in `Suspense` because Clerk's client components call `usePathname()` under Cache Components. Both auth pages render their Clerk component inside it and pass `authFormAppearance` (`lib/clerk-appearance.ts`: `fontSize: 1rem`, `spacing: 1.25rem`, width cap `34rem` on `rootBox`, card `margin-inline: auto` so it is centered in the right panel at every width), scoped to the auth forms so the navbar `UserButton` menu keeps its default size. The GitHub / Google buttons are styled as raised boxes (`--bg-subtle` fill, `--border-subtle` ring, soft shadow via an `!important` `box-shadow`, since Clerk's own button ring is a box-shadow). The copyright year is hardcoded (`2026`). Measured on `next start`: card offset from the right panel's center is 0px on both axes at 1728px wide, and 20px left/right at 373px wide.
  - `app/page.tsx`: `auth()` inside a `Suspense`-wrapped async component, then `redirect` to `/editor` (signed in) or `/sign-in`.
  - `app/editor/layout.tsx` mounts `EditorShell` (moved out of the root layout so auth pages have no editor chrome); `app/editor/page.tsx` is a placeholder.
  - `EditorNavbar` right slot is just Clerk's default `<UserButton />` (the editor is only reachable signed in, so the signed-out buttons were removed).
  - Verified: `tsc`, `eslint`, and `npm run build` pass. Against `next start`: `/`, `/editor`, and `/api/*` return 307 to `/sign-in?redirect_url=...` when signed out; `/sign-in`, `/sign-up`, and sub-paths (e.g. `/sign-in/factor-one`) return 200. In the browser: signed-out `/` lands on `/sign-in`; both auth pages show the two-panel layout with app tokens; after the screenshot-driven redesign the split measures 864px / 864px at a 1728px viewport with a 544px card and no page scroll, and a 373px-wide iframe hides the left panel with 16px gutters and no horizontal scroll; with an existing signed-in session, `/sign-in` bounced to `/` then `/editor`, and the `UserButton` avatar rendered in the navbar. Not exercised: completing a sign-in/sign-up, the `UserButton` menu, sign-out.

## In Progress

- Nothing.

## Next Up

- Next feature unit from `feature-spcs/` after 03.
- Project list / workspace routes (when added) live under the protected default; no matcher change needed.

## Open Questions

- The shadcn CLI (4.21.4) generated `components/ui/*` with `import { cn } from "cn"` (the npm `cn` package) instead of `@/lib/utils`. Resolved with a `"cn": ["./lib/utils"]` path alias in `tsconfig.json` so the generated files stay unmodified. Decide whether to instead rewrite those imports to `@/lib/utils` and drop the alias.

- The `clerk-custom-ui` skill says to always use Clerk's `shadcn` theme when `components.json` exists; 03 Auth's spec explicitly requires `dark` instead, so the spec was followed.
- `clerk init` also installed 8 Clerk agent skills globally in `~/.agents/skills` (symlinked for Claude Code); the install reported failures only for the PromptScript target, which does not support global skills.

## Architecture Decisions

- Auth is Clerk (`@clerk/nextjs`). Provider lives in `app/layout.tsx` inside `<body>`; middleware is `proxy.ts` (Next.js 16). Never expose `CLERK_SECRET_KEY` client-side; do not read or print `.env.local`.
- Routes are protected by default in `proxy.ts`; only the sign-in/sign-up paths from the existing Clerk env vars are public. `cacheComponents` is on, so anything calling `auth()` or rendering Clerk client components that read the path must sit inside `<Suspense>`.

- `ProjectSidebar` is `absolute` and must be placed inside a `relative` container below the navbar; `EditorShell` owns the `isOpen` state. `New Project` button has no handler yet (dialogs come later).
- `EditorShell` is mounted in `app/editor/layout.tsx`, so only `/editor` routes get the editor chrome; auth pages use `AuthLayout` instead.
- Dialog pattern is a wrapper (`DialogShell`) over unmodified `components/ui/dialog.tsx`; the shadcn overlay stays default since `components/ui/*` is protected.

- shadcn style is `base-nova` (Base UI primitives, not Radix); triggers use a `render` prop instead of `asChild`.
- Dark only: `<html class="dark">`, tokens defined on `:root` in `globals.css`; shadcn semantic vars (`--background`, `--primary`, `--border`, ...) alias the project tokens.

## Session Notes

- `app/editor/page.tsx` is still a placeholder; layout metadata title is still the create-next-app default.
- Clerk's dev session cookie is shared across `localhost` ports, so a browser already signed in on `localhost:3000` is also signed in on any other `localhost` port. Use `127.0.0.1` to see the signed-out state without signing out.
- `next dev` rewrites the tracked `AGENTS.md` (Next.js agent-rules and agent-feedback blocks) on start. It was restored after the browser check; expect that diff to reappear whenever the dev server runs.
