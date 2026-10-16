"use client";

import { useFeedMessages } from "@liveblocks/react";

import { AI_STATUS_FEED_ID, parseAiStatusMessage, type AiStatusMessage } from "@/types/tasks";

// The most recent message in the room's `ai-status-feed`, or `null` when the feed is empty (or
// does not exist yet, or has not loaded), or when its latest message is not a valid status
// message. Only the latest is returned, not the history. Updates live as tasks write to the feed.
//
// Uses the plain hook, so the sidebar can render outside the canvas's Suspense boundary.
export function useAiStatus(): AiStatusMessage | null {
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);

  // Picked by `createdAt` rather than by position, so it does not depend on the list's order.
  const latest = messages?.reduce<(typeof messages)[number] | null>(
    (newest, message) => (!newest || message.createdAt >= newest.createdAt ? message : newest),
    null,
  );

  return latest ? parseAiStatusMessage(latest.data) : null;
}
