import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { findAccessibleProject, getCurrentUser } from "@/lib/project-access";
import { specFilename } from "@/lib/spec-filename";
import { listProjectSpecs } from "@/lib/spec-storage";

interface SpecsRouteContext {
  params: Promise<{ projectId: string }>;
}

// The project's generated specs, newest first, as `{ specs: [{ id, filename, createdAt }] }`. The
// owner and collaborators can list them. A project the user cannot open is 403 (the same answer
// for a missing project and one they are not on, as in the download route). Metadata only: the
// content comes from the download route, and the blob URL never leaves the server.
export async function GET(_request: Request, { params }: SpecsRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { projectId } = await params;
  const project = await findAccessibleProject(projectId, user);

  if (!project) {
    return errorResponse(403, "Forbidden");
  }

  const specs = await listProjectSpecs(projectId);

  return Response.json(
    {
      specs: specs.map((spec) => ({
        id: spec.id,
        filename: specFilename(project.name, spec.createdAt),
        createdAt: spec.createdAt.toISOString(),
      })),
    },
    // Who may read this depends on the signed-in user, so no shared cache may keep it.
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
