"use client";

import { useEffect, useRef, useState } from "react";
import { useRoom } from "@liveblocks/react";

import { AiChatEmptyState } from "@/components/editor/ai-chat-empty-state";
import { AiChatInput } from "@/components/editor/ai-chat-input";
import { AiChatMessage } from "@/components/editor/ai-chat-message";
import { AiStatusIndicator } from "@/components/editor/ai-status-indicator";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useAiChatFeedReady } from "@/hooks/use-ai-chat-feed-ready";
import { useLatestAiStatus } from "@/hooks/use-ai-status";
import { useAiThinking } from "@/hooks/use-ai-thinking";
import { useDesignRun } from "@/hooks/use-design-run";

// The AI Architect tab: the room's shared conversation (or the empty state before the first
// message) above the message input. Must sit in a flex column that gives it a height, under a
// `RoomProvider`. The conversation subscribes to the `ai-chat` feed, which has to exist first.
export function AiArchitectTab() {
  const isFeedReady = useAiChatFeedReady();

  if (!isFeedReady) {
    return (
      <p role="status" className="flex flex-1 items-center justify-center text-xs text-copy-muted">
        Connecting to the room...
      </p>
    );
  }

  return <AiChatPanel />;
}

function AiChatPanel() {
  const { messages, sendMessage, sendAssistantMessage, isSending, error, userId } = useAiChat();
  const roomId = useRoom().id;
  const status = useLatestAiStatus();
  // The run you started (the input locks from the moment you send) or anyone's, read from presence.
  const designRun = useDesignRun({
    roomId,
    onFinished: (message) => void sendAssistantMessage(message),
    status,
  });
  const isGenerating = useAiThinking() || designRun.isActive;
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  async function submit() {
    if (isGenerating) return;
    const prompt = draft.trim();
    // The draft is cleared only once the message is in the feed, so a failure keeps the text.
    if (!(await sendMessage(draft))) return;
    setDraft("");
    // The canvas is not updated here: the task edits the room and Liveblocks shows it to everyone.
    await designRun.start(prompt);
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
          <div role="log" aria-label="Conversation" className="flex flex-col gap-5 px-1">
            {messages.map((message) => (
              <AiChatMessage
                key={message.id}
                message={message}
                isOwn={message.sender.id === userId}
              />
            ))}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="shrink-0 pt-2 text-xs text-state-error">
          {error}
        </p>
      )}
      <AiStatusIndicator isActive={isGenerating} />
      <AiChatInput
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        textareaRef={inputRef}
        isGenerating={isGenerating}
        isSending={isSending}
      />
    </>
  );
}
