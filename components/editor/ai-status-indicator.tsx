"use client";

import { useAiStatus } from "@/hooks/use-ai-status";

const WORKING_TEXT = "Ghost AI is working...";

interface AiStatusIndicatorProps {
  // Whether a design run is active, for you or for anyone else in the room.
  isActive: boolean;
}

// The compact status strip above the chat input: a pulsing dot and the latest message from the
// room's `ai-status-feed`. Renders nothing unless a run is active. Must render under a
// `RoomProvider`.
export function AiStatusIndicator({ isActive }: AiStatusIndicatorProps) {
  const status = useAiStatus();

  if (!isActive) return null;

  // A `complete` or `error` message at the top of the feed belongs to the previous run, so while a
  // new one is active it says "working" until the new run writes its own first message.
  const isCurrent = status?.text !== undefined && status.kind !== "complete" && status.kind !== "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-2 flex shrink-0 items-center gap-2 rounded-xl border border-chat/30 bg-base px-3 py-2"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-chat opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-chat" />
      </span>
      <p className="min-w-0 text-xs break-words text-copy-secondary">
        {isCurrent ? status.text : WORKING_TEXT}
      </p>
    </div>
  );
}
