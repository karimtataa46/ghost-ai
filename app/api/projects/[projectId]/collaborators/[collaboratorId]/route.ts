import { auth } from "@clerk/nextjs/server";

import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { removeCollaborator } from "@/lib/collaborators";
import { denyUnlessOwner } from "@/lib/projects";

interface CollaboratorRouteContext {
  params: Promise<{ projectId: string; collaboratorId: string }>;
}

// Owner only: removes a collaborator from the project.
export async function DELETE(_request: Request, { params }: CollaboratorRouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorizedResponse();
  }

  const { projectId, collaboratorId } = await params;
  const denied = await denyUnlessOwner(projectId, userId);

  if (denied) {
    return denied;
  }

  // Scoped to the project, so an ID from another project is a 404, not a deletion.
  if (!(await removeCollaborator(projectId, collaboratorId))) {
    return errorResponse(404, "Collaborator not found");
  }

  return Response.json({ id: collaboratorId });
}
