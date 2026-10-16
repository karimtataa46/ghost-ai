import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { findAccessibleProject, getCurrentUser } from "@/lib/project-access";
import { specFilename } from "@/lib/spec-filename";
import { findProjectSpec, openSpecFile } from "@/lib/spec-storage";

interface SpecDownloadRouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

// A generated spec as a Markdown attachment. The owner and collaborators can download it. A
// project the user cannot open is 403 (the same answer for a missing project and one they are not
// on, so a project ID's existence is not revealed, as in the AI routes), and a spec that does not
// exist, or belongs to another project, is 404. The blob URL is never sent to the client: the
// bytes are streamed from here after the checks.
export async function GET(_request: Request, { params }: SpecDownloadRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { projectId, specId } = await params;
  const project = await findAccessibleProject(projectId, user);

  if (!project) {
    return errorResponse(403, "Forbidden");
  }

  // Looked up by project as well as ID, so a spec of another project is not found here even when
  // the user can open both.
  const spec = await findProjectSpec(projectId, specId);

  if (!spec) {
    return errorResponse(404, "Spec not found");
  }

  const file = await openSpecFile(spec.filePath);

  if (!file) {
    console.error("A spec's file is missing from Blob", { projectId, specId });

    return errorResponse(404, "Spec file not found");
  }

  return new Response(file.stream, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${specFilename(project.name, spec.createdAt)}"`,
      // No `Content-Length`: Blob's own is not reliable (see `openSpecFile`), so the body streams
      // chunked and the browser reads it to the end.
      // Who may read this depends on the signed-in user, so no shared cache may keep it.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
