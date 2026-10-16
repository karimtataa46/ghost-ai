import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/ai-chat";

interface AiChatMessageProps {
  message: ChatMessage;
  // True for the viewer's own messages, which sit on the right.
  isOwn: boolean;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// One chat message as a bubble. The sender and time are not drawn: they are the bubble's hover
// `title` and its accessible label. The viewer's own messages are on the right (green, the tail
// corner at the bottom right); everyone else's are on the left. The assistant's has an avatar
// and a dark bubble with purple text (tail at the bottom left); other people's keep the green.
export function AiChatMessage({ message, isOwn }: AiChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const label = `${isOwn ? "You" : message.sender.name}, ${formatTime(message.timestamp)}`;

  return (
    <article
      aria-label={label}
      title={label}
      className={cn("flex items-start gap-2", isOwn ? "justify-end" : "justify-start")}
    >
      {isAssistant && (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ai/15 text-ai-text"
        >
          <Bot className="h-4 w-4" />
        </span>
      )}
      <p
        className={cn(
          // `text-[1rem]`, not `text-base`: in this project that is a color (see ui-context.md).
          "max-w-[80%] rounded-3xl px-4 py-3 text-[1rem] leading-relaxed whitespace-pre-wrap wrap-anywhere",
          isAssistant
            ? "rounded-bl-md border border-surface-border bg-surface text-ai-text"
            : cn(
                "bg-chat text-[color:var(--bg-base)]",
                // The tail points at whoever sent it: right for you, left for others.
                isOwn ? "rounded-br-md" : "rounded-bl-md"
              )
        )}
      >
        {message.content}
      </p>
    </article>
  );
}
