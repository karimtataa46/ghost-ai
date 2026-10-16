"use client";

import { useEffect, useRef, useState } from "react";
import { useCreateFeed, useFeeds } from "@liveblocks/react";

import { AI_CHAT_FEED_ID } from "@/types/tasks";

// Makes sure the room's `ai-chat` feed exists before anything subscribes to it, and returns
// whether it is safe to. Subscribing to a feed that does not exist yet fails, and that failure is
// not retried, so the first person to open a room's chat creates the feed here. Two people doing
// that at once is fine: the loser's request is refused as "already exists" and the feed is there
// either way.
//
// Uses the plain hooks, so the sidebar can render outside the canvas's Suspense boundary.
export function useAiChatFeedReady(): boolean {
  const { feeds, isLoading } = useFeeds();
  const createFeed = useCreateFeed();
  const [hasTried, setHasTried] = useState(false);
  const isRequested = useRef(false);

  const exists = feeds?.some((feed) => feed.feedId === AI_CHAT_FEED_ID) ?? false;

  useEffect(() => {
    if (isLoading || exists || isRequested.current) return;

    isRequested.current = true;
    // Whatever the outcome, stop waiting: a real failure then shows when someone sends.
    createFeed(AI_CHAT_FEED_ID)
      .catch(() => undefined)
      .finally(() => setHasTried(true));
  }, [isLoading, exists, createFeed]);

  return exists || hasTried;
}
