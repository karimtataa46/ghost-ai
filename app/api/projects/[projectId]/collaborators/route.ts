import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import {
  addCollaborator,
  isCollaborator,
  isValidEmail,
  listCollaborators,
  normalizeEmail,
} from "@/lib/collaborators";
import { findAccessibleProject, getCurrentUser } from "@/lib/project-access";
import { denyUnlessOwner, isUniqueViolation } from "@/lib/projects";
import { readJsonObject } from "@/lib/request-body";

interface CollaboratorsRouteContext {
  params: Promise<{ projectId: string }>;
}

// The owner and the project's collaborators can read the list; anyone else gets 404, the
// same answer as for a project that does not exist.
export async function GET(_request: Request, { params }: CollaboratorsRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { projectId } = await params;
  const project = await findAccessibleProject(projectId, user);

  if (!project) {
    return errorResponse(404, "Project not found");
  }

  return Response.json({ collaborators: await listCollaborators(projectId) });
}

// Owner only: adds a collaborator by email.
export async function POST(request: Request, { params }: CollaboratorsRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse(400, "Request body must be a JSON object");
  }

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

  if (!email) {
    return errorResponse(400, "email is required");
  }

  if (!isValidEmail(email)) {
    return errorResponse(400, "Enter a valid email address");
  }

  const { projectId } = await params;
  const denied = await denyUnlessOwner(projectId, user.userId);

  if (denied) {
    return denied;
  }

  if (user.email?.toLowerCase() === email) {
    return errorResponse(400, "You already own this project");
  }

  if (await isCollaborator(projectId, email)) {
    return errorResponse(409, "This person already has access");
  }

  try {
    const collaborator = await addCollaborator(projectId, email);

    return Response.json({ collaborator }, { status: 201 });
  } catch (error) {
    // A concurrent invite for the same email won the race.
    if (isUniqueViolation(error)) {
      return errorResponse(409, "This person already has access");
    }

    throw error;
  }
}
