import { Prisma } from "@/app/generated/prisma/client";
import { errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const DEFAULT_PROJECT_NAME = "Untitled Project";

// Fields the API returns. `ownerId` and `canvasJsonPath` stay server-side.
export const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

// Matches the room ID format: lowercase words joined by single hyphens, within Liveblocks' 128-character room ID limit.
const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROJECT_ID_MAX_LENGTH = 128;

export function isValidProjectId(value: string) {
  return value.length <= PROJECT_ID_MAX_LENGTH && PROJECT_ID_PATTERN.test(value);
}

// What the sidebar and workspace need; the API's `projectSelect` returns more.
const projectSummarySelect = {
  id: true,
  name: true,
} satisfies Prisma.ProjectSelect;

const collaboratorEmail = (email: string) => ({
  collaborators: { some: { email: { equals: email, mode: "insensitive" as const } } },
});

export function listOwnedProjects(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: projectSummarySelect,
  });
}

// Projects the user was added to as a collaborator, matched by email. Own projects are excluded.
export function listSharedProjects(userId: string, email: string) {
  return prisma.project.findMany({
    where: { ownerId: { not: userId }, ...collaboratorEmail(email) },
    orderBy: { createdAt: "desc" },
    select: projectSummarySelect,
  });
}

// The project when the user owns it or is a collaborator on it, otherwise null.
export function findAccessibleProject(projectId: string, userId: string, email: string | null) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, ...(email ? [collaboratorEmail(email)] : [])],
    },
    select: projectSummarySelect,
  });
}

// Returns null when `userId` owns the project, otherwise the 404 / 403 response to send.
// Only the owner may rename or delete; collaborators get 403.
export async function denyUnlessOwner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return errorResponse(404, "Project not found");
  }

  if (project.ownerId !== userId) {
    return errorResponse(403, "Forbidden");
  }

  return null;
}

// Prisma throws P2025 when `update` / `delete` match no row, e.g. the project was
// deleted between the ownership check and the mutation.
export function isRecordNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

// Prisma throws P2002 when `create` hits an existing unique value, e.g. a taken project ID.
export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
