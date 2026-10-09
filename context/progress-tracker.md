# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation setup

## Current Goal

- Define the next feature unit (01 Design System is complete).

## Completed

- 01 Design System (`feature-spcs/01-design-system.md`): shadcn/ui installed (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/`, unmodified), `lucide-react`, `cn()` in `lib/utils.ts` (clsx + tailwind-merge), dark-only theme tokens in `app/globals.css` with shadcn variables mapped onto them. `tsc` and `next build` pass.

## In Progress

- None.

## Next Up

- Next feature unit from `feature-spcs/`.

## Open Questions

- The shadcn CLI (4.21.4) generated `components/ui/*` with `import { cn } from "cn"` (the npm `cn` package) instead of `@/lib/utils`. Resolved with a `"cn": ["./lib/utils"]` path alias in `tsconfig.json` so the generated files stay unmodified. Decide whether to instead rewrite those imports to `@/lib/utils` and drop the alias.

## Architecture Decisions

- shadcn style is `base-nova` (Base UI primitives, not Radix); triggers use a `render` prop instead of `asChild`.
- Dark only: `<html class="dark">`, tokens defined on `:root` in `globals.css`; shadcn semantic vars (`--background`, `--primary`, `--border`, ...) alias the project tokens.

## Session Notes

- `app/page.tsx` is still the placeholder; layout metadata title is still the create-next-app default.
