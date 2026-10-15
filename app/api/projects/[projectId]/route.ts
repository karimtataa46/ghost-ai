import { auth } from "@clerk/nextjs/server";

import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getLiveblocks } from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import { denyUnlessOwner, isRecordNotFound, projectSelect } from "@/lib/projects";
import { readJsonObject } from "@/lib/request-body";

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

  // The project ID is the Liveblocks room ID and the client picks it, so a room left behind could
  // be claimed by whoever re-creates the ID. Delete it first: Liveblocks does not error on a
  // missing room, so a failure here (or in the delete below) can simply be retried.
  await getLiveblocks().deleteRoom(projectId);

  try {
    await prisma.project.delete({
      where: { id: projectId, ownerId: userId },
      select: { id: true },
    });

    return Response.json({ id: projectId });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return errorResponse(404, "Project not found");
    }

    throw error;
  }
}
