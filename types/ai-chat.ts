import type { AiChatFeedMessage } from "@/types/tasks";

export type ChatRole = AiChatFeedMessage["role"];

// A message from the `ai-chat` feed that passed validation, with the feed's own ID and the time
// the server stored it (the order the conversation is shown in).
export interface ChatMessage extends AiChatFeedMessage {
  id: string;
  createdAt: number;
}
