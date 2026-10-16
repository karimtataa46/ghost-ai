import { jsonRequest, ProjectApiError, request } from "@/lib/project-api";

export interface TaskRunHandle {
  runId: string;
  // A Trigger.dev public token that can only read this run.
  publicToken: string;
}

function readString(body: unknown, key: string): string | null {
  if (typeof body !== "object" || body === null || !(key in body)) return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" && value !== "" ? value : null;
}

// Starts a background task through its route and returns what the browser needs to follow the run.
// The start route (`POST <startPath>`) answers with the run ID and `POST <startPath>/token` issues
// the run-scoped token; a token already in the first response is used as is. Both the design and
// the spec routes follow this shape.
export async function startTaskRun(startPath: string, body: unknown): Promise<TaskRunHandle> {
  const started = await request(startPath, jsonRequest("POST", body));
  const runId = readString(started, "runId");
  if (!runId) throw new ProjectApiError("Unexpected response from the server.", 0);

  const publicToken =
    readString(started, "publicToken") ??
    readString(await request(`${startPath}/token`, jsonRequest("POST", { runId })), "token");
  if (!publicToken) throw new ProjectApiError("Unexpected response from the server.", 0);

  return { runId, publicToken };
}
