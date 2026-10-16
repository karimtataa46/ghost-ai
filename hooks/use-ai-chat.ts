"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { shallow, useCreateFeedMessage, useFeedMessages, useSelf } from "@liveblocks/react";

import type { ChatMessage } from "@/types/ai-chat";
import {
  AI_CHAT_FEED_ID,
  AI_CHAT_MAX_LENGTH,
  AI_SENDER,
  aiChatMessageSchema,
  parseAiChatMessage,
} from "@/types/tasks";

interface AiChat {
  // The room's conversation, oldest first. Only messages that pass validation are included.
  messages: ChatMessage[];
  // Sends the text to everyone in the room. Resolves to whether it was sent; on failure `error`
  // says why. Blank text is ignored.
  sendMessage: (content: string) => Promise<boolean>;
  // Adds a message from the assistant (the AI's reply or an error) to the room's conversation.
  // Resolves to whether it was added; a failure is not reported further, since the caller is
  // itself reporting a result.
  sendAssistantMessage: (content: string) => Promise<boolean>;
  isSending: boolean;
  error: string | null;
  // The Clerk user ID of the viewer (to tell their messages apart), or null until the room connects.
  userId: string | null;
}

// The room's chat for the AI Architect tab, read from and written to the Liveblocks Feed
// `ai-chat` (separate from `ai-status-feed`). Everyone in the room sees the same conversation in
// real time. Nothing here asks the AI for a reply. Must be used once the feed exists
// (`useAiChatFeedReady`), under a `RoomProvider`.
export function useAiChat(): AiChat {
  const { messages: feedMessages } = useFeedMessages(AI_CHAT_FEED_ID);
  const createFeedMessage = useCreateFeedMessage();
  const sender = useSelf((self) => ({ id: self.id, name: self.info.name }), shallow);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A ref as well as state, so a double submit in the same tick cannot send twice.
  const isSendingRef = useRef(false);

  const messages = useMemo(() => {
    const valid: ChatMessage[] = [];
    for (const feedMessage of feedMessages ?? []) {
      // Anything with access to the room can write to the feed, so check before rendering.
      const data = parseAiChatMessage(feedMessage.data);
      if (data) valid.push({ ...data, id: feedMessage.id, createdAt: feedMessage.createdAt });
    }
    // By the time the server stored them, with the ID as a tie-break for a stable order.
    return valid.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }, [feedMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || isSendingRef.current) return false;

      if (text.length > AI_CHAT_MAX_LENGTH) {
        setError(`Messages can be up to ${AI_CHAT_MAX_LENGTH} characters.`);
        return false;
      }
      if (!sender) {
        setError("Still connecting to the room. Try again in a moment.");
        return false;
      }

      const data = aiChatMessageSchema.safeParse({
        sender,
        role: "user",
        content: text,
        timestamp: Date.now(),
      });
      if (!data.success) {
        setError("That message could not be sent.");
        return false;
      }

      isSendingRef.current = true;
      setIsSending(true);
      setError(null);
      try {
        await createFeedMessage(AI_CHAT_FEED_ID, data.data);
        return true;
      } catch {
        setError("Could not send your message. Try again.");
        return false;
      } finally {
        isSendingRef.current = false;
        setIsSending(false);
      }
    },
    [createFeedMessage, sender],
  );

  const sendAssistantMessage = useCallback(
    async (content: string) => {
      const data = aiChatMessageSchema.safeParse({
        sender: AI_SENDER,
        role: "assistant",
        // Cut to the limit instead of dropping the message, so a long error still shows.
        content: content.trim().slice(0, AI_CHAT_MAX_LENGTH),
        timestamp: Date.now(),
      });
      if (!data.success) return false;

      try {
        await createFeedMessage(AI_CHAT_FEED_ID, data.data);
        return true;
      } catch {
        return false;
      }
    },
    [createFeedMessage],
  );

  return {
    messages,
    sendMessage,
    sendAssistantMessage,
    isSending,
    error,
    userId: sender?.id ?? null,
  };
}
