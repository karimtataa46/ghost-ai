import { errorFrom, ProjectApiError, request, send } from "@/lib/project-api";
import type { SpecChatMessage, SpecEdge, SpecNode } from "@/lib/spec-input";
import { startTaskRun, type TaskRunHandle } from "@/lib/task-run-api";
import type { ProjectSpecSummary } from "@/types/spec";

// What one spec run reads: the room (its ID is the project's), the conversation, and the graph.
export interface SpecRunInput {
  roomId: string;
  chatHistory: SpecChatMessage[];
  nodes: SpecNode[];
  edges: SpecEdge[];
}

// Starts a spec run (`POST /api/ai/spec`, then a run-scoped token from `.../token`) and returns
// what the browser needs to follow it. Throws `ProjectApiError` with the route's own message, such
// as the one for a canvas with no components.
export function startSpecRun(input: SpecRunInput): Promise<TaskRunHandle> {
  return startTaskRun("/api/ai/spec", input);
}

function isSpecSummary(value: unknown): value is ProjectSpecSummary {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "filename" in value &&
    typeof value.filename === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    !Number.isNaN(Date.parse(value.createdAt))
  );
}

function specsUrl(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/specs`;
}

// The route that serves a spec's Markdown as a file attachment. Used for both the preview (read
// as text) and the download (left to the browser), so the client never touches the Blob URL.
export function specDownloadUrl(projectId: string, specId: string) {
  return `${specsUrl(projectId)}/${encodeURIComponent(specId)}/download`;
}

// The project's specs, newest first. Throws `ProjectApiError` on a failed request or a reply that
// is not a list of specs.
export async function listSpecs(projectId: string): Promise<ProjectSpecSummary[]> {
  const body = await request(specsUrl(projectId), { method: "GET", cache: "no-store" });
  const specs = typeof body === "object" && body !== null && "specs" in body ? body.specs : null;

  if (Array.isArray(specs) && specs.every(isSpecSummary)) {
    return specs;
  }

  throw new ProjectApiError("Unexpected response from the server.", 0);
}

// One spec's Markdown, read from the download route (a `fetch` ignores its
// `Content-Disposition: attachment`). Throws `ProjectApiError` on a failed request. The caller
// should keep the text only while it is showing it.
export async function loadSpecContent(projectId: string, specId: string): Promise<string> {
  const response = await send(specDownloadUrl(projectId, specId), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw errorFrom(await response.json().catch(() => null), response.status);
  }

  return response.text();
}
