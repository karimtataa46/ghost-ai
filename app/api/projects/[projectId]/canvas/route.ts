import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { parseCanvasSnapshot } from "@/lib/canvas-snapshot";
import { loadCanvas, saveCanvas } from "@/lib/canvas-storage";
import { findAccessibleProject, getCurrentUser } from "@/lib/project-access";
import { isRecordNotFound } from "@/lib/projects";
import { readJsonObject } from "@/lib/request-body";

interface CanvasRouteContext {
  params: Promise<{ projectId: string }>;
}

// The saved canvas as `{ canvas: { nodes, edges } }`, or `{ canvas: null }` when the project has
// none yet. The owner and collaborators can read it; anyone else gets 404, the same answer as for
// a project that does not exist.
export async function GET(_request: Request, { params }: CanvasRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { projectId } = await params;
  const project = await findAccessibleProject(projectId, user);

  if (!project) {
    return errorResponse(404, "Project not found");
  }

  return Response.json({ canvas: await loadCanvas(projectId) });
}

// Saves the canvas (`{ nodes, edges }`) to Vercel Blob and records its URL on the project. The
// owner and collaborators can save, since both edit the canvas. What is stored is the validated
// copy, not the request body.
export async function PUT(request: Request, { params }: CanvasRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request);
  const snapshot = parseCanvasSnapshot(body);

  if (!snapshot) {
    return errorResponse(400, "Request body must be a canvas with valid nodes and edges");
  }

  const { projectId } = await params;
  const project = await findAccessibleProject(projectId, user);

  if (!project) {
    return errorResponse(404, "Project not found");
  }

  try {
    const savedAt = await saveCanvas(projectId, snapshot);

    return Response.json({ savedAt });
  } catch (error) {
    // The project was deleted between the access check and the write.
    if (isRecordNotFound(error)) {
      return errorResponse(404, "Project not found");
    }

    throw error;
  }
}
