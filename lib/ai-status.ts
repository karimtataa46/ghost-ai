import { logger } from "@trigger.dev/sdk";

import { getLiveblocks } from "@/lib/liveblocks";
import { AI_STATUS_FEED_ID, type AiStatusKind, type AiStatusMessage } from "@/types/tasks";

// How many messages the feed keeps. A run trims older ones when it first writes to a room, so the
// feed does not grow with every run and a late joiner loads it in one page.
const MAX_STATUS_MESSAGES = 30;

// Rooms whose feed this process has already created and trimmed.
const preparedRooms = new Set<string>();

// Creates the room's `ai-status-feed` if it does not exist yet, and trims it to the newest
// `MAX_STATUS_MESSAGES`.
async function prepareFeed(roomId: string): Promise<void> {
  if (preparedRooms.has(roomId)) return;

  const liveblocks = getLiveblocks();

  try {
    await liveblocks.getFeed({ roomId, feedId: AI_STATUS_FEED_ID });
  } catch {
    // Not there yet (a room gets its feed from its first run). A concurrent run may have
    // created it in the meantime, in which case this call fails and the feed is there anyway.
    await liveblocks.createFeed({ roomId, feedId: AI_STATUS_FEED_ID }).catch(() => undefined);
  }

  const { data } = await liveblocks.getFeedMessages({ roomId, feedId: AI_STATUS_FEED_ID });
  const stale = data
    .toSorted((a, b) => a.createdAt - b.createdAt)
    .slice(0, Math.max(0, data.length - MAX_STATUS_MESSAGES));

  await Promise.all(
    stale.map((message) =>
      liveblocks.deleteFeedMessage({ roomId, feedId: AI_STATUS_FEED_ID, messageId: message.id }),
    ),
  );

  preparedRooms.add(roomId);
}

// Adds a line to the room's `ai-status-feed`, which every participant's sidebar reads. Progress
// text is cosmetic, so a failed write is logged and never stops the run.
export async function publishAiStatus(
  roomId: string,
  kind: AiStatusKind,
  text: string,
): Promise<void> {
  const data: AiStatusMessage = { kind, text };

  try {
    await prepareFeed(roomId);
    await getLiveblocks().createFeedMessage({ roomId, feedId: AI_STATUS_FEED_ID, data });
  } catch (error) {
    logger.warn("Could not publish AI status", { roomId, kind, error: String(error) });
  }
}
