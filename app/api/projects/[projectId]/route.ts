import { auth } from "@clerk/nextjs/server";

import { ProjectStatus } from "@/app/generated/prisma/client";
import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { deleteCanvasBlob } from "@/lib/canvas-storage";
import { getLiveblocks } from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import { denyUnlessOwner, isRecordNotFound, projectSelect } from "@/lib/projects";
import { readJsonObject } from "@/lib/request-body";
import { deleteProjectSpecBlobs } from "@/lib/spec-storage";

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>;
}

export async function PATCH(request: Request, { params }: ProjectRouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse(400, "Request body must be a JSON object");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return errorResponse(400, "name is required");
  }

  const { projectId } = await params;
  const denied = await denyUnlessOwner(projectId, userId);

  if (denied) {
    return denied;
  }

  try {
    // `ownerId` in the filter keeps the ownership rule on the write itself.
    const project = await prisma.project.update({
      where: { id: projectId, ownerId: userId },
      data: { name },
      select: projectSelect,
    });

    return Response.json({ project });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return errorResponse(404, "Project not found");
    }

    throw error;
  }
}

export async function DELETE(_request: Request, { params }: ProjectRouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await params;
  const denied = await denyUnlessOwner(projectId, userId);

  if (denied) {
    return denied;
  }

  try {
    // Mark the project first. `findAccessibleProject` refuses a deleting project, so a token
    // request that arrives while the room is going away cannot re-create it.
    await prisma.project.update({
      where: { id: projectId, ownerId: userId },
      data: { status: ProjectStatus.DELETING },
      select: { id: true },
    });

    // The project ID is the Liveblocks room ID and the client picks it, so a room left behind could
    // be claimed by whoever re-creates the ID. Delete it before the row: Liveblocks does not error
    // on a missing room, so a failure here (or in the delete below) leaves the project marked and
    // closed, and the owner can simply retry.
    await getLiveblocks().deleteRoom(projectId);

    const { canvasJsonPath } = await prisma.project.delete({
      where: { id: projectId, ownerId: userId },
      select: { canvasJsonPath: true },
    });

    // Nothing points at the saved canvas any more. A failure is logged, not thrown: the project
    // is already gone, so the request cannot be retried.
    if (canvasJsonPath) {
      await deleteCanvasBlob(canvasJsonPath);
    }

    // The spec rows went with the project (cascade), but their files are separate blobs.
    await deleteProjectSpecBlobs(projectId);

    return Response.json({ id: projectId });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return errorResponse(404, "Project not found");
    }

    throw error;
  }
}
