import { createGoogle } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, task } from "@trigger.dev/sdk";
import { generateText, jsonSchema, NoObjectGeneratedError, Output } from "ai";

import { GEMINI_MODEL_IDS, isRateLimited } from "@/lib/ai-models";
import { createAiPresence } from "@/lib/ai-presence";
import { publishAiStatus } from "@/lib/ai-status";
import {
  DESIGN_PLAN_JSON_SCHEMA,
  applyDesignAction,
  orderDesignActions,
  parseDesignPlan,
  type DesignAction,
  type DesignPlan,
} from "@/lib/design-actions";
import { DESIGN_SYSTEM_PROMPT, buildDesignPrompt, describeCanvas } from "@/lib/design-prompt";
import { getLiveblocks } from "@/lib/liveblocks";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

const MODEL_TIMEOUT_MS = 90_000;
const PROMPT_PREVIEW_LENGTH = 80;

// An error whose message is safe to show to everyone in the room. Anything else (a provider or
// network failure) is logged in full and shown as a generic line, so no internal detail (a URL,
// a key fragment) reaches the feed.
class DesignAgentError extends Error {}

const GENERIC_FAILURE = "Something went wrong while designing. Try again.";
const USAGE_LIMIT_FAILURE = "The AI service has reached its usage limit. Try again later.";

function userMessage(error: unknown): string {
  return error instanceof DesignAgentError ? error.message : GENERIC_FAILURE;
}

function preview(prompt: string): string {
  const oneLine = prompt.replace(/\s+/g, " ");

  return oneLine.length > PROMPT_PREVIEW_LENGTH
    ? `${oneLine.slice(0, PROMPT_PREVIEW_LENGTH - 1)}…`
    : oneLine;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

// The canvas as it is now. `mutateFlow` is the headless counterpart of the editor's
// `useLiveblocksFlow`: it reads and writes the same `flow` in the room's Storage.
async function readCanvas(roomId: string) {
  let nodes: readonly CanvasNode[] = [];
  let edges: readonly CanvasEdge[] = [];

  await mutateFlow<CanvasNode, CanvasEdge>({ client: getLiveblocks(), roomId }, (flow) => {
    nodes = flow.nodes;
    edges = flow.edges;
  });

  return { nodes, edges };
}

// Asks Gemini for the canvas changes that satisfy the prompt, as a validated plan.
async function planDesign(prompt: string, canvas: string): Promise<DesignPlan> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new DesignAgentError("The AI service is not configured.");
  }

  const google = createGoogle({ apiKey });

  let output: unknown;
  let everyModelRateLimited = true;

  for (const [index, modelId] of GEMINI_MODEL_IDS.entries()) {
    try {
      const result = await generateText({
        model: google(modelId),
        system: DESIGN_SYSTEM_PROMPT,
        prompt: buildDesignPrompt(prompt, canvas),
        temperature: 0.4,
        abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
        // The SDK retries a 429 twice more (it ignores a Retry-After longer than a minute and
        // waits 2s, then 4s), which cannot help against a daily quota. The next model in the
        // list is the retry.
        maxRetries: 0,
        // The shape is checked here; each action is checked on its own in `parseDesignPlan`, so
        // one malformed action does not discard the others.
        output: Output.object({
          schema: jsonSchema<unknown>(DESIGN_PLAN_JSON_SCHEMA, {
            validate: (value) => ({ success: true, value }),
          }),
        }),
      });

      output = result.output;
      break;
    } catch (error) {
      everyModelRateLimited &&= isRateLimited(error);

      logger.warn("Design model failed", {
        modelId,
        error: String(error),
        // Set when the model answered but not with a readable plan (cut off, or not JSON).
        ...(NoObjectGeneratedError.isInstance(error) && { finishReason: error.finishReason }),
      });

      if (index === GEMINI_MODEL_IDS.length - 1) {
        throw everyModelRateLimited ? new DesignAgentError(USAGE_LIMIT_FAILURE) : error;
      }
    }
  }

  const plan = parseDesignPlan(output);

  if (!plan) {
    throw new DesignAgentError("The AI returned a design that could not be read.");
  }

  if (plan.actions.length === 0) {
    throw new DesignAgentError("The AI did not suggest any changes to the canvas.");
  }

  return plan;
}

// The line announcing a group of same-kind actions.
function phaseMessage(action: DesignAction, count: number): string {
  switch (action.type) {
    case "add_node":
      return `Adding ${plural(count, "component")}`;
    case "add_edge":
      return `Connecting ${plural(count, "link")}`;
    case "delete_node":
    case "delete_edge":
      return `Removing ${plural(count, "item")}`;
    default:
      return `Updating ${plural(count, "existing component")}`;
  }
}

// Which group an action belongs to for the status lines (move / resize / update read as one).
function phaseOf(action: DesignAction): string {
  return action.type === "move_node" || action.type === "resize_node" || action.type === "update_node"
    ? "update"
    : action.type;
}

// Turns a prompt into canvas changes in the project's room: reads the canvas, asks Gemini for a
// plan, then applies it one action at a time so everyone watching sees the diagram grow, with
// the AI's cursor and thinking state in presence and progress lines in the room's status feed.
// Exported separately from the task so it can be run without the Trigger.dev runtime.
export async function runDesignAgent(payload: DesignAgentPayload, runId: string) {
  const { prompt, roomId } = payload;
  const presence = createAiPresence(roomId);
  const status = (kind: Parameters<typeof publishAiStatus>[1], text: string) =>
    publishAiStatus(roomId, kind, text);

  let applied = 0;
  let total = 0;

  try {
    await presence.start();
    await status("start", `Started working on: "${preview(prompt)}"`);

    await status("progress", "Reading the canvas");
    const { nodes, edges } = await readCanvas(roomId);

    await status("progress", "Planning the design");
    const plan = await planDesign(prompt, describeCanvas(nodes, edges));
    const actions = orderDesignActions(plan.actions);

    total = actions.length;
    logger.log("Design planned", { runId, roomId, actions: total, dropped: plan.dropped });

    let phase = "";

    for (const [index, action] of actions.entries()) {
      if (phaseOf(action) !== phase) {
        phase = phaseOf(action);

        const count = actions.filter((other) => phaseOf(other) === phase).length;

        await status("progress", phaseMessage(action, count));
      }

      let result: ReturnType<typeof applyDesignAction> = { applied: false };

      await mutateFlow<CanvasNode, CanvasEdge>({ client: getLiveblocks(), roomId }, (flow) => {
        result = applyDesignAction(flow, action);
      });

      if (result.applied) {
        applied += 1;
        // Move the AI's cursor to what it just touched, so people can follow along.
        if (result.focus) await presence.update({ cursor: result.focus });
      } else {
        logger.warn("Design action skipped", { runId, index, action, reason: result.reason });
      }
    }

    if (applied === 0) {
      throw new DesignAgentError("None of the AI's changes could be applied to the canvas.");
    }

    await status("complete", `${plan.summary} (${plural(applied, "change")} applied)`);

    return { roomId, summary: plan.summary, applied, skipped: total - applied };
  } catch (error) {
    logger.error("Design agent failed", { runId, roomId, applied, total, error: String(error) });

    await status(
      "error",
      applied > 0
        ? `${userMessage(error)} Stopped after ${applied} of ${total} changes.`
        : userMessage(error),
    );

    throw error;
  } finally {
    await presence.clear();
  }
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 3600,
  // Applying a plan is not idempotent (a retry would add the nodes again), so a failure is
  // reported once and not retried.
  retry: { maxAttempts: 1 },
  run: (payload: DesignAgentPayload, { ctx }) => runDesignAgent(payload, ctx.run.id),
});
