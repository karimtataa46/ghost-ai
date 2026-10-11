import { auth } from "@clerk/nextjs/server";

import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROJECT_NAME,
  isUniqueViolation,
  isValidProjectId,
  projectSelect,
} from "@/lib/projects";
import { readJsonObject } from "@/lib/request-body";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return unauthorizedResponse();
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: projectSelect,
  });

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse(400, "Request body must be a JSON object");
  }

  const { id, name } = body;

  if (name !== undefined && name !== null && typeof name !== "string") {
    return errorResponse(400, "name must be a string");
  }

  // The project ID doubles as the Liveblocks room ID, so the client may choose it.
  // Without one, the schema's default (cuid) applies.
  if (id !== undefined && id !== null && (typeof id !== "string" || !isValidProjectId(id))) {
    return errorResponse(400, "id must be lowercase letters, numbers, and hyphens (max 128 characters)");
  }

  // A missing, null, or blank name falls back to the default.
  const projectName = (typeof name === "string" ? name.trim() : "") || DEFAULT_PROJECT_NAME;

  try {
    const project = await prisma.project.create({
      data: { ...(id ? { id } : {}), ownerId: userId, name: projectName },
      select: projectSelect,
    });

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return errorResponse(409, "A project with this id already exists");
    }

    throw error;
  }
}
