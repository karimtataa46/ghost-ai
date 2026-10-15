// The vivid text colors of the canvas node palette (`context/ui-context.md`), tuned for the
// dark canvas. The neutral one is left out because a near-white cursor would not stand out.
export const CURSOR_COLORS = [
  "#52A8FF", // blue
  "#BF7AF0", // purple
  "#FF990A", // orange
  "#FF6166", // red
  "#F75F8F", // pink
  "#62C073", // green
  "#0AC7B4", // teal
] as const;

// Maps a user ID to one color of the palette. The same ID always gets the same color, on
// any server and on every sign-in, so a person keeps their cursor color across sessions.
export function getCursorColor(userId: string): string {
  // FNV-1a, a small string hash with a good spread over short inputs.
  let hash = 0x811c9dc5;

  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return CURSOR_COLORS[(hash >>> 0) % CURSOR_COLORS.length];
}
