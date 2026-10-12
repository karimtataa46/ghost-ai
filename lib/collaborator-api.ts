import { jsonRequest, ProjectApiError, request } from "@/lib/project-api";
import type { Collaborator } from "@/types/collaborator";

function isCollaborator(value: unknown): value is Collaborator {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "name" in value &&
    (typeof value.name === "string" || value.name === null) &&
    "imageUrl" in value &&
    (typeof value.imageUrl === "string" || value.imageUrl === null)
  );
}

function collaboratorsUrl(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/collaborators`;
}

export async function listCollaborators(projectId: string): Promise<Collaborator[]> {
  const body = await request(collaboratorsUrl(projectId), { method: "GET" });
  const collaborators =
    typeof body === "object" && body !== null && "collaborators" in body ? body.collaborators : null;

  if (Array.isArray(collaborators) && collaborators.every(isCollaborator)) {
    return collaborators;
  }

  throw new ProjectApiError("Unexpected response from the server.", 0);
}

export async function inviteCollaborator(projectId: string, email: string): Promise<Collaborator> {
  const body = await request(collaboratorsUrl(projectId), jsonRequest("POST", { email }));
  const collaborator =
    typeof body === "object" && body !== null && "collaborator" in body ? body.collaborator : null;

  if (isCollaborator(collaborator)) {
    return collaborator;
  }

  throw new ProjectApiError("Unexpected response from the server.", 0);
}

export async function removeCollaborator(projectId: string, collaboratorId: string) {
  await request(`${collaboratorsUrl(projectId)}/${encodeURIComponent(collaboratorId)}`, {
    method: "DELETE",
  });
}
