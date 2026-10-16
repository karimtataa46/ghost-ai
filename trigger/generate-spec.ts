import { createGoogle } from "@ai-sdk/google";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";

import { GEMINI_MODEL_IDS, isRateLimited } from "@/lib/ai-models";
import { generateSpecPayloadSchema, type GenerateSpecPayload } from "@/lib/spec-input";
import { SPEC_SYSTEM_PROMPT, buildSpecPrompt, cleanSpecMarkdown } from "@/lib/spec-prompt";
import { saveSpec } from "@/lib/spec-storage";
import type { SpecRunMetadata, SpecRunStatus } from "@/types/tasks";

const MODEL_TIMEOUT_MS = 90_000;

// An error whose message is safe to show to the person who started the run. Anything else (a
// provider or network failure) is logged in full and reported as a generic line, so no internal
// detail (a URL, a key fragment) reaches the run's metadata or error.
class SpecGenerationError extends Error {}

const GENERIC_FAILURE = "Something went wrong while writing the spec. Try again.";
const USAGE_LIMIT_FAILURE = "The AI service has reached its usage limit. Try again later.";
const SAVE_FAILURE = "The spec was written but could not be saved. Try again.";

function userMessage(error: unknown): string {
  return error instanceof SpecGenerationError ? error.message : GENERIC_FAILURE;
}

// Where the run is, for the browser following it (`useRealtimeRun` reads `run.metadata`; the shape
// is `SpecRunMetadata`). Progress is cosmetic, so it never throws into the run.
function report(status: SpecRunStatus, message: string, specId?: SpecRunMetadata["specId"]) {
  try {
    metadata.set("status", status).set("message", message);

    if (specId) {
      metadata.set("specId", specId);
    }
  } catch (error) {
    logger.warn("Could not update spec run metadata", { status, error: String(error) });
  }
}

// Asks Gemini for the spec as Markdown. Each model is tried only if the one before it fails, with
// the SDK's own retries off (a daily quota 429 cannot be retried away, and each model has its own
// quota); a 429 from every model reports the usage limit. A reply that is empty or was cut off
// counts as a failure of that model.
async function writeSpec(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new SpecGenerationError("The AI service is not configured.");
  }

  const google = createGoogle({ apiKey });

  let lastError: unknown;
  let everyModelRateLimited = true;

  for (const modelId of GEMINI_MODEL_IDS) {
    try {
      const result = await generateText({
        model: google(modelId),
        system: SPEC_SYSTEM_PROMPT,
        prompt,
        abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
        maxRetries: 0,
      });

      if (result.finishReason === "length") {
        throw new SpecGenerationError("The AI's spec was cut off before it finished.");
      }

      const spec = cleanSpecMarkdown(result.text);

      if (!spec) {
        throw new SpecGenerationError("The AI did not return a spec.");
      }

      return spec;
    } catch (error) {
      lastError = error;
      everyModelRateLimited &&= isRateLimited(error);

      logger.warn("Spec model failed", { modelId, error: String(error) });
    }
  }

  throw everyModelRateLimited ? new SpecGenerationError(USAGE_LIMIT_FAILURE) : lastError;
}

// Stores the spec (Blob file + `ProjectSpec` row) and returns its ID. A failure here is not the
// model's, so it gets its own line instead of the generic one, and the real error is logged.
async function persistSpec(projectId: string, spec: string): Promise<string> {
  try {
    const saved = await saveSpec(projectId, spec);

    return saved.id;
  } catch (error) {
    logger.error("Could not save the spec", { projectId, error: String(error) });

    throw new SpecGenerationError(SAVE_FAILURE);
  }
}

// Turns the canvas and the chat into a Markdown technical spec, saves it to the project, and
// returns the Markdown (the run's output; the saved copy's ID is in the run metadata). If it
// cannot be saved the run fails: a spec nobody can download is not a finished one. Exported
// separately from the task so it can be run without the Trigger.dev runtime.
export async function runGenerateSpec(payload: unknown, runId: string): Promise<string> {
  try {
    report("started", "Reading the canvas and the chat");

    const parsed = generateSpecPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      logger.error("Spec input is not valid", { runId, issues: parsed.error.issues });

      throw new SpecGenerationError("The canvas could not be read. Try again.");
    }

    const { projectId, roomId, chatHistory, nodes, edges } = parsed.data;

    logger.log("Spec requested", {
      runId,
      projectId,
      roomId,
      nodes: nodes.length,
      edges: edges.length,
      chatMessages: chatHistory.length,
    });

    report("generating", "Writing the spec");

    const spec = await writeSpec(buildSpecPrompt({ nodes, edges, chatHistory }));

    logger.log("Spec written", { runId, roomId, characters: spec.length });
    report("generating", "Saving the spec");

    const specId = await persistSpec(projectId, spec);

    logger.log("Spec saved", { runId, projectId, specId });
    report("complete", "The spec is ready", specId);

    return spec;
  } catch (error) {
    logger.error("Spec generation failed", { runId, error: String(error) });

    const message = userMessage(error);

    report("error", message);

    // Throw the safe line, not the original: the run's error is readable by whoever holds its token.
    throw new SpecGenerationError(message);
  }
}

export const generateSpec = task({
  id: "generate-spec",
  maxDuration: 300,
  // The model fallback above is the retry: it already tries three models, and a second attempt
  // would repeat minutes of failing calls with someone watching, and flip the status from `error`
  // back to `generating`. A failure is reported once.
  retry: { maxAttempts: 1 },
  run: (payload: GenerateSpecPayload, { ctx }) => runGenerateSpec(payload, ctx.run.id),
});
