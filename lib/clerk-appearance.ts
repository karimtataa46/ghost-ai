import type { Appearance } from "@clerk/ui";
import { dark } from "@clerk/ui/themes";

// Clerk's dark theme as the base, with its variables pointed at the app's
// CSS tokens from globals.css so Clerk never carries its own colors.
export const clerkAppearance: Appearance = {
  theme: dark,
  variables: {
    colorPrimary: "var(--accent-primary)",
    colorPrimaryForeground: "var(--bg-base)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    colorWarning: "var(--state-warning)",
    colorNeutral: "var(--text-primary)",
    colorForeground: "var(--text-primary)",
    colorMuted: "var(--bg-elevated)",
    colorMutedForeground: "var(--text-muted)",
    colorBackground: "var(--bg-surface)",
    colorInput: "var(--bg-elevated)",
    colorInputForeground: "var(--text-primary)",
    colorBorder: "var(--border-default)",
    colorRing: "var(--accent-primary)",
    colorModalBackdrop: "var(--bg-base)",
    borderRadius: "var(--radius)",
  },
};

// GitHub / Google buttons: a filled box with a 1px ring and a soft drop shadow
// so they stand out from the card surface. Clerk draws its own button outline
// as a box-shadow ring (border width is 0), so the shadow is replaced rather
// than the border; `!important` is needed to beat Clerk's variant styles.
// Colors come from the app tokens.
const socialButtonBox = {
  backgroundColor: "var(--bg-subtle)",
  boxShadow:
    "0 0 0 1px var(--border-subtle), 0 4px 12px color-mix(in srgb, var(--bg-base) 80%, transparent) !important",
};

// Applied only to the sign-in / sign-up forms (merged over `clerkAppearance`)
// so the larger scale does not leak into the navbar's UserButton menu.
export const authFormAppearance: Appearance = {
  variables: {
    fontSize: "1rem",
    spacing: "1.25rem",
  },
  elements: {
    // The width cap lives on rootBox so the right panel can center it.
    // Clerk also caps the card at `100vw` minus its padding, which can leave it
    // narrower than rootBox on phones, so the card centers itself too.
    rootBox: { width: "100%", maxWidth: "34rem" },
    cardBox: { width: "100%", marginInline: "auto" },
    socialButtonsBlockButton: socialButtonBox,
    socialButtonsIconButton: socialButtonBox,
  },
};
