"use client";

import { useFeedMessages } from "@liveblocks/react";

import { AI_STATUS_FEED_ID, parseAiStatusMessage, type AiStatusMessage } from "@/types/tasks";

// The newest message in `ai-status-feed`, with the feed's own ID for it so a caller can tell a new
// message from one it has already seen.
export interface LatestAiStatus {
  id: string;
  message: AiStatusMessage;
}

// The most recent message in the room's `ai-status-feed`, or `null` when the feed is empty (or
// does not exist yet, or has not loaded), or when its latest message is not a valid status
// message. Only the latest is returned, not the history. Updates live as tasks write to the feed.
//
// Uses the plain hook, so the sidebar can render outside the canvas's Suspense boundary.
export function useLatestAiStatus(): LatestAiStatus | null {
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);

  // Picked by `createdAt` rather than by position, so it does not depend on the list's order.
  const latest = messages?.reduce<(typeof messages)[number] | null>(
    (newest, message) => (!newest || message.createdAt >= newest.createdAt ? message : newest),
    null,
  );

  const message = latest ? parseAiStatusMessage(latest.data) : null;

  return latest && message ? { id: latest.id, message } : null;
}

// The latest status message alone, for callers that only show it.
export function useAiStatus(): AiStatusMessage | null {
  return useLatestAiStatus()?.message ?? null;
}
