import { runs, tasks } from "@trigger.dev/sdk";

import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { findAccessibleProject, getCurrentUser } from "@/lib/project-access";
import { readJsonObject } from "@/lib/request-body";
import { createTaskRun } from "@/lib/task-runs";
import type { DesignAgentPayload, designAgentTask } from "@/trigger/design-agent";

const MAX_PROMPT_LENGTH = 4000;
// Fixed, user-safe text: the sidebar shows it as is, and the real cause goes to the server log.
const START_FAILED_MESSAGE = "Could not start the design. Try again.";

// Starts design generation as a background task and records the run for its starter.
// Returns the run ID; the client gets a run-scoped token from /api/ai/design/token.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse(400, "Request body must be a JSON object");
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const { roomId, projectId } = body;

  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return errorResponse(400, `prompt must be 1 to ${MAX_PROMPT_LENGTH} characters`);
  }

  if (typeof roomId !== "string" || !roomId || typeof projectId !== "string" || !projectId) {
    return errorResponse(400, "roomId and projectId are required");
  }

  // A missing project and one the user may not open get the same answer.
  const project = await findAccessibleProject(projectId, user);

  if (!project) {
    return errorResponse(403, "You don't have access to this project");
  }

  // The project ID is the Liveblocks room ID, so the task can only target this project's room.
  if (roomId !== project.id) {
    return errorResponse(400, "roomId does not belong to this project");
  }

  const payload: DesignAgentPayload = { prompt, roomId: project.id };
  let runId: string;

  try {
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", payload);
    runId = handle.id;
  } catch (error) {
    console.error("POST /api/ai/design: could not trigger the design task", {
      projectId: project.id,
      error,
    });

    return errorResponse(502, START_FAILED_MESSAGE);
  }

  try {
    await createTaskRun({ runId, projectId: project.id, userId: user.userId });
  } catch (error) {
    console.error("POST /api/ai/design: could not store the task run", {
      projectId: project.id,
      runId,
      error,
    });

    // Without a TaskRun row nobody can get a token for the run, so stop it rather than let it
    // edit the canvas unseen.
    try {
      await runs.cancel(runId);
    } catch (cancelError) {
      console.error("POST /api/ai/design: could not cancel the orphaned run", {
        runId,
        error: cancelError,
      });
    }

    return errorResponse(500, START_FAILED_MESSAGE);
  }

  return Response.json({ runId }, { status: 202 });
}
