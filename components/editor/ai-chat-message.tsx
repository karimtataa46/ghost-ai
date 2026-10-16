import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/ai-chat";

interface AiChatMessageProps {
  message: ChatMessage;
}

// One chat bubble: the person's on the right, the assistant's on the left.
export function AiChatMessage({ message }: AiChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere",
          isUser
            ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
            : "border border-surface-border bg-elevated text-ai-text"
        )}
      >
        <span className="sr-only">{isUser ? "You: " : "Ghost AI: "}</span>
        {message.content}
      </p>
    </div>
  );
}
