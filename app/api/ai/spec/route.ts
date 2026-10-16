import { runs, tasks } from "@trigger.dev/sdk";

import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { findAccessibleProject, getCurrentUser } from "@/lib/project-access";
import { readJsonObject } from "@/lib/request-body";
import {
  describeInputIssue,
  specRequestSchema,
  type GenerateSpecPayload,
} from "@/lib/spec-input";
import { createTaskRun } from "@/lib/task-runs";
import type { generateSpec } from "@/trigger/generate-spec";

// Fixed, user-safe text: the client shows it as is, and the real cause goes to the server log.
const START_FAILED_MESSAGE = "Could not start the spec. Try again.";

// Starts spec generation as a background task and records the run for its starter.
// Returns the run ID; the client gets a run-scoped token from /api/ai/spec/token.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse(400, "Request body must be a JSON object");
  }

  // Parsing keeps only the known fields, so a `projectId` sent by the client is dropped here.
  const parsed = specRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(400, describeInputIssue(parsed.error));
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // The project ID is the Liveblocks room ID, so the project comes from the room and the signed-in
  // user. A missing project and one the user may not open get the same answer.
  const project = await findAccessibleProject(roomId, user);

  if (!project) {
    return errorResponse(403, "You don't have access to this project");
  }

  const payload: GenerateSpecPayload = {
    projectId: project.id,
    roomId: project.id,
    chatHistory,
    nodes,
    edges,
  };
  let runId: string;

  try {
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", payload);
    runId = handle.id;
  } catch (error) {
    console.error("POST /api/ai/spec: could not trigger the spec task", {
      projectId: project.id,
      error,
    });

    return errorResponse(502, START_FAILED_MESSAGE);
  }

  try {
    await createTaskRun({ runId, projectId: project.id, userId: user.userId });
  } catch (error) {
    console.error("POST /api/ai/spec: could not store the task run", {
      projectId: project.id,
      runId,
      error,
    });

    // Without a TaskRun row nobody can get a token for the run, so stop it rather than let it
    // run unseen.
    try {
      await runs.cancel(runId);
    } catch (cancelError) {
      console.error("POST /api/ai/spec: could not cancel the orphaned run", {
        runId,
        error: cancelError,
      });
    }

    return errorResponse(500, START_FAILED_MESSAGE);
  }

  return Response.json({ runId }, { status: 202 });
}
