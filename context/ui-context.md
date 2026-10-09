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

8 defined color pairs. Each pair specifies a dark node fill and a vivid contrasting text color tuned for readability on the dark canvas. Defined in `types/canvas.ts` as `NODE_COLORS`.

| Node fill | Text color | Character              |
| --------- | ---------- | ---------------------- |
| `#1F1F1F` | `#EDEDED`  | Neutral dark (default) |
| `#10233D` | `#52A8FF`  | Blue                   |
| `#2E1938` | `#BF7AF0`  | Purple                 |
| `#331B00` | `#FF990A`  | Orange                 |
| `#3C1618` | `#FF6166`  | Red                    |
| `#3A1726` | `#F75F8F`  | Pink                   |
| `#0F2E18` | `#62C073`  | Green                  |
| `#062822` | `#0AC7B4`  | Teal                   |

Default node color: `#1F1F1F` with `#EDEDED` text.

### Edge Style

Smooth-step path with an arrow marker. Default edge color: `#f8fafc`. Stroke width is thin — edges are visually secondary to nodes.

### Node Shapes

6 supported shapes, defined in `types/canvas.ts` as `NODE_SHAPES`. Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs rather than CSS borders.

- `rectangle` — default general-purpose node
- `diamond` — decision / gateway
- `circle` — event / endpoint
- `pill` — service / process
- `cylinder` — database / storage
- `hexagon` — external system / boundary

### Connection Handles

Small white circular handles, hidden by default, revealed on node hover. Appear at all four sides of a node.

### Canvas Background

React Flow `<Background>` component. Canvas sits on the base background color.

Until the canvas exists, `app/editor/page.tsx` renders a `bg-grid` container: a 32px square grid of 1px lines (the `bg-grid` utility in `globals.css`, lines are `--text-primary` at 12% via `color-mix`, a low-saturation white; the earlier `--border-default` lines were too dark to see). The editor home (`components/editor/editor-home.tsx`) is centered on top of it. Drop `bg-grid` when React Flow's `<Background>` takes over, so the grid isn't drawn twice.

### Editor Home

Centered on the grid, no card: `h1` (`text-2xl`, `sm:text-3xl`, `font-semibold`, `text-copy-primary`), a `text-sm text-copy-muted` description, and a `size="lg"` `New Project` button with a `Plus` icon.

## Project Dialogs and Sidebar Items

- Create, Rename, and Delete use `DialogShell`. Create shows a live slug preview under the name input (`font-mono` `bg-subtle` chip, `your-project-name` while empty). Rename shows `Current name: <name>` as its description and auto-focuses a prefilled input. Delete has no input and a `variant="destructive"` confirm button. Footer buttons are `Cancel` (`outline`) plus the primary action; both are disabled while loading and the primary label switches to `Creating...` / `Renaming...` / `Deleting...`.
- Name inputs go through `components/dialogs/project-name-field.tsx` (label + shadcn `Input` with `text-copy-primary`).
- Sidebar project rows: name (`text-sm text-copy-secondary`, truncated) with `Pencil` and `Trash2` `ghost` `icon-sm` buttons (`text-copy-muted`, delete hovers to `text-state-error`). The buttons render only for projects the user owns; shared projects show the name only.
- Below `md` the open sidebar has a `bg-base/70` scrim behind it; tapping the scrim closes the sidebar. From `md` up there is no scrim and the sidebar closes only through its toggle/close buttons.

## Tailwind Token Pitfall

`base` is a color token (`--color-base`), so `text-base` compiles to `color: var(--bg-base)` and sets no font size. Never use `text-base` (or `sm:text-base`) in app code; use `text-sm`, `text-[1rem]`, etc. The protected shadcn `Input` uses `text-base`, so always give it an explicit text color class such as `text-copy-primary`.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch. shadcn semantic variables (`--background`, `--primary`, `--border`, `--input`, `--ring`, ...) are aliased to the project tokens in `globals.css`, so generated components render in the dark theme without edits. `<html>` carries the `dark` class so `dark:` variants apply.

## Clerk

Clerk components use the `dark` theme from `@clerk/ui/themes`, configured in `lib/clerk-appearance.ts`. Its `variables` are `var(--...)` references to the tokens above — never hex values. Keep Clerk's default user menu and profile flows; do not rebuild them. Auth pages (`components/auth/auth-layout.tsx`): exact 50/50 split at `lg` and up, form only below `lg`; no gradients or feature cards. Left panel (`bg-surface`, `border-r`): compact logo top-left, a large headline (`text-3xl`, `xl:text-4xl`) with an intro paragraph, three features as icon + title + description rows (small `bg-accent-dim` icon tile, no card), and a copyright footer. Right panel (`bg-base`): the Clerk card, centered on both axes and scaled up via `authFormAppearance` in `lib/clerk-appearance.ts` (`fontSize: 1rem`, `spacing: 1.25rem`, width cap `34rem` on `rootBox`, card `margin-inline: auto`) and applied only to `<SignIn>` / `<SignUp>` so the navbar `UserButton` menu keeps its default size. The GitHub / Google buttons get a raised look (`--bg-subtle` fill, 1px `--border-subtle` ring, soft shadow) so they stand out from the card; Clerk draws button outlines as a box-shadow ring, so this is done by replacing `box-shadow` with `!important`. The stacked "Continue with …" buttons and "Last used" badge are Clerk's own behavior for returning users; do not replicate them manually.

## Layout Patterns

- Editor workspace: full-viewport layout — floating sidebar overlay on the left, center canvas, slide-over AI sidebar on the right.
- Sidebars: floating overlay with dark semi-transparent background and subtle border.
- Modals and dialogs: centered overlay, `rounded-3xl`, dark background with backdrop blur.
- Navbar: top bar with dark background and bottom border.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states.
