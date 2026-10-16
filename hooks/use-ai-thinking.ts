"use client";

import { useOthers, useSelf } from "@liveblocks/react";

// Whether the AI is working in this room, read from presence: `thinking` is set on the AI's own
// presence while a task runs (`lib/ai-presence.ts`), and on a person's while the AI works for
// them. Everyone in the room sees the same answer.
//
// Uses the plain hooks, so the sidebar can render outside the canvas's Suspense boundary; both
// report "not thinking" until the room connects. The selectors return a boolean, so the sidebar
// re-renders when the flag flips, not as pointers move.
export function useAiThinking(): boolean {
  const othersThinking = useOthers((others) => others.some((other) => other.presence.thinking));
  const selfThinking = useSelf((self) => self.presence.thinking);

  return othersThinking || selfThinking === true;
}
