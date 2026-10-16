import { auth } from "@trigger.dev/sdk";

import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/project-access";
import { readJsonObject } from "@/lib/request-body";
import { findOwnedTaskRun } from "@/lib/task-runs";

// Issues a Trigger.dev public token that can only read the run the caller started.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request);
  const runId = typeof body?.runId === "string" ? body.runId : "";

  if (!runId) {
    return errorResponse(400, "runId is required");
  }

  try {
    const taskRun = await findOwnedTaskRun(runId, user.userId);

    if (!taskRun) {
      return errorResponse(404, "Run not found");
    }

    const token = await auth.createPublicToken({
      scopes: { read: { runs: [taskRun.runId] } },
      expirationTime: "1h",
    });

    return Response.json({ token });
  } catch (error) {
    console.error("POST /api/ai/design/token: could not issue a token", { runId, error });

    return errorResponse(500, "Could not get access to the design run. Try again.");
  }
}
