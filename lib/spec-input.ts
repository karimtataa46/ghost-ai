import { z } from "zod";

import { NODE_SHAPES } from "@/types/canvas";
import { aiChatMessageSchema } from "@/types/tasks";

// Bounds on what one spec run reads, so a request cannot make the prompt (and the bill) unbounded.
export const MAX_SPEC_NODES = 200;
export const MAX_SPEC_EDGES = 400;
// The prompt carries only the newest messages. A room's chat history is never trimmed, so a longer
// one is cut here instead of refused: otherwise a busy room could never generate a spec again.
export const MAX_SPEC_CHAT_MESSAGES = 30;
const MAX_CHAT_MESSAGES_ACCEPTED = 500;
const MAX_ID_LENGTH = 128;
// Canvas text has no length limit in the editor, so an overlong label is clipped, not refused.
const MAX_LABEL_LENGTH = 200;

function clippedText() {
  return z.string().transform((value) => value.trim().slice(0, MAX_LABEL_LENGTH));
}

// Only what a spec needs from a node. Everything else the client sends (position, size, color,
// React Flow's local state) is dropped by parsing.
const specNodeSchema = z.object({
  id: z.string().min(1).max(MAX_ID_LENGTH),
  data: z.object({
    label: clippedText(),
    shape: z.enum(NODE_SHAPES),
  }),
});

const specEdgeSchema = z.object({
  id: z.string().min(1).max(MAX_ID_LENGTH),
  source: z.string().min(1).max(MAX_ID_LENGTH),
  target: z.string().min(1).max(MAX_ID_LENGTH),
  // The text on the edge, when it has any.
  label: clippedText().optional(),
});

// What the chat contributes: who spoke and what they said.
const specChatMessageSchema = aiChatMessageSchema.pick({ role: true, content: true });

// The input of one `generate-spec` run. The project ID is the room ID, and `projectId` is set by the
// route from the project the signed-in user was found to have access to, never read from a request.
export const generateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1).max(MAX_ID_LENGTH),
  chatHistory: z
    .array(specChatMessageSchema)
    .max(MAX_CHAT_MESSAGES_ACCEPTED)
    .transform((messages) => messages.slice(-MAX_SPEC_CHAT_MESSAGES)),
  nodes: z
    .array(specNodeSchema)
    .min(1, "Add at least one component to the canvas before generating a spec")
    .max(MAX_SPEC_NODES),
  edges: z.array(specEdgeSchema).max(MAX_SPEC_EDGES),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;
export type SpecNode = GenerateSpecPayload["nodes"][number];
export type SpecEdge = GenerateSpecPayload["edges"][number];
export type SpecChatMessage = GenerateSpecPayload["chatHistory"][number];

// The body of `POST /api/ai/spec`. A `projectId` in a request is ignored: parsing drops it.
export const specRequestSchema = generateSpecPayloadSchema.omit({ projectId: true });

// The first problem in a failed parse as one line for an API error, such as
// `nodes.3.data.shape: Invalid option: ...`.
export function describeInputIssue(error: z.ZodError): string {
  const issue = error.issues[0];

  if (!issue) return "Invalid request";

  const path = issue.path.join(".");

  return path ? `${path}: ${issue.message}` : issue.message;
}
