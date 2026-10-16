import { z } from "zod";

// The room's feed that background AI tasks write their progress to. One feed for every kind of
// task (design now, specs later); the sidebar shows its latest message.
export const AI_STATUS_FEED_ID = "ai-status-feed";

// What a status message says about the run that wrote it.
export type AiStatusKind = "start" | "progress" | "complete" | "error";

const AI_STATUS_KINDS: readonly string[] = ["start", "progress", "complete", "error"];

// The data of one message in `ai-status-feed`. Both fields are optional so a task can send just a
// line of text, or only a kind. A `type`, not an `interface`: Liveblocks needs it to be
// assignable to its JSON types.
export type AiStatusMessage = {
  text?: string;
  kind?: AiStatusKind;
};

// Checks the data of a feed message before it is shown, since anything with access to the room
// can write to a feed. Returns the message with only the fields it knows (and a blank `text`
// left out), or `null` when the data is not a valid status message.
export function parseAiStatusMessage(data: unknown): AiStatusMessage | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;

  const { text, kind } = data as Record<string, unknown>;

  if (text !== undefined && typeof text !== "string") return null;
  if (kind !== undefined && (typeof kind !== "string" || !AI_STATUS_KINDS.includes(kind))) {
    return null;
  }

  const message: AiStatusMessage = {};
  if (typeof text === "string" && text.trim() !== "") message.text = text.trim();
  if (kind !== undefined) message.kind = kind as AiStatusKind;

  return message;
}

// Where a `generate-spec` run is, as it reports it in its run metadata (`status`, with `message`
// beside it). The browser follows it with `useRealtimeRun`, which reads `run.metadata`.
export type SpecRunStatus = "started" | "generating" | "complete" | "error";

// The run metadata of a `generate-spec` run. `message` is a line that is safe to show to the person
// who started the run: on `error` it is a fixed, user-facing reason, never provider detail.
// `specId` is the saved spec's `ProjectSpec` ID, set together with `complete`; the file is
// `GET /api/projects/{projectId}/specs/{specId}/download`.
export interface SpecRunMetadata {
  status: SpecRunStatus;
  message: string;
  specId?: string;
}

// The room's feed for the sidebar conversation. Kept apart from `ai-status-feed`: that one carries
// progress written by background tasks, this one carries what people (and later the AI) say.
export const AI_CHAT_FEED_ID = "ai-chat";

// Who the assistant's messages in `ai-chat` come from. The ID is also the AI's identity in the
// room's presence (`AI_USER_ID` in `lib/ai-presence.ts`).
export const AI_SENDER = { id: "ghost-ai", name: "Ghost AI" } as const;

// The longest message a person can send, counted after trimming.
export const AI_CHAT_MAX_LENGTH = 2000;

// The data of one message in `ai-chat`. Anything with access to the room can write to a feed, so
// every message is parsed with this before it is shown. `timestamp` is when the sender's browser
// sent it (milliseconds since the epoch), `sender` is who wrote it, `role` is `user` for people.
export const aiChatMessageSchema = z.object({
  sender: z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
  }),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(AI_CHAT_MAX_LENGTH),
  timestamp: z.number().int().positive(),
});

export type AiChatFeedMessage = z.infer<typeof aiChatMessageSchema>;

// Returns the message with only the fields it knows, or `null` when the data is not a valid chat
// message.
export function parseAiChatMessage(data: unknown): AiChatFeedMessage | null {
  const result = aiChatMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}
