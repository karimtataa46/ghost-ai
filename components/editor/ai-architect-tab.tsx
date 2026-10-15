"use client";

import { useEffect, useRef, useState } from "react";

import { AiChatEmptyState } from "@/components/editor/ai-chat-empty-state";
import { AiChatInput } from "@/components/editor/ai-chat-input";
import { AiChatMessage } from "@/components/editor/ai-chat-message";
import { useAiChat } from "@/hooks/use-ai-chat";

// The AI Architect tab: a scrollable conversation (or the empty state before the first
// message) above the message input. Must sit in a flex column that gives it a height.
export function AiArchitectTab() {
  const { messages, sendMessage } = useAiChat();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  function submit() {
    if (sendMessage(draft)) setDraft("");
  }

  function selectPrompt(prompt: string) {
    setDraft(prompt);
    inputRef.current?.focus();
  }

  return (
    <>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <AiChatEmptyState onSelectPrompt={selectPrompt} />
        ) : (
          <div role="log" aria-label="Conversation" className="flex flex-col gap-3 pr-1">
            {messages.map((message) => (
              <AiChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
      <AiChatInput
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        textareaRef={inputRef}
      />
    </>
  );
}
