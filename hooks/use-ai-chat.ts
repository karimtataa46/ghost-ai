"use client";

import { useCallback, useRef, useState } from "react";

import type { ChatMessage } from "@/types/ai-chat";

interface AiChat {
  messages: ChatMessage[];
  // Appends a user message. Blank text is ignored. Returns whether a message was added.
  sendMessage: (content: string) => boolean;
}

// Local chat state for the AI Architect tab. Nothing is sent anywhere yet: there is no
// assistant reply until AI generation exists.
export function useAiChat(): AiChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // A counter rather than `crypto.randomUUID`, which browsers only provide on secure origins.
  const nextId = useRef(0);

  const sendMessage = useCallback((content: string) => {
    const text = content.trim();
    if (!text) return false;

    nextId.current += 1;
    const message: ChatMessage = { id: `message-${nextId.current}`, role: "user", content: text };
    setMessages((current) => [...current, message]);
    return true;
  }, []);

  return { messages, sendMessage };
}
