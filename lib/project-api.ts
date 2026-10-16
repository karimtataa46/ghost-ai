import type { Project } from "@/types/project";

// Thrown for any failed request; `status` is 0 when the request never got a response.
export class ProjectApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ProjectApiError";
  }
}

// Fetches, mapping a network failure to `ProjectApiError` with status 0.
export async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ProjectApiError("Could not reach the server. Check your connection and try again.", 0);
  }
}

// Errors are `{ error }` from the routes; anything else (HTML 500, empty body) gets a generic message.
export function errorFrom(body: unknown, status: number): ProjectApiError {
  const message =
    typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : "Something went wrong. Try again.";

  return new ProjectApiError(message, status);
}

export async function request(url: string, init: RequestInit): Promise<unknown> {
  const response = await send(url, init);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw errorFrom(body, response.status);
  }

  return body;
}

export function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function readProject(body: unknown): Project {
  const project =
    typeof body === "object" && body !== null && "project" in body ? body.project : null;

  if (
    typeof project === "object" &&
    project !== null &&
    "id" in project &&
    typeof project.id === "string" &&
    "name" in project &&
    typeof project.name === "string"
  ) {
    return { id: project.id, name: project.name };
  }

  throw new ProjectApiError("Unexpected response from the server.", 0);
}

export async function createProject(id: string, name: string) {
  return readProject(await request("/api/projects", jsonRequest("POST", { id, name })));
}

export async function renameProject(id: string, name: string) {
  return readProject(
    await request(`/api/projects/${encodeURIComponent(id)}`, jsonRequest("PATCH", { name }))
  );
}

export async function deleteProject(id: string) {
  await request(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
}
