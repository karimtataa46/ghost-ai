import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { collaboratorEmail, projectSummarySelect } from "@/lib/projects";
import type { WorkspaceProject } from "@/types/project";

export interface CurrentUser {
  userId: string;
  // Verified primary email, used to match collaborators. Null when it is not verified.
  email: string | null;
}

// Null when signed out. Cached per request so a layout and its page share one Clerk lookup.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress;
  const isVerified = primaryEmail?.verification?.status === "verified";

  return { userId, email: isVerified ? primaryEmail.emailAddress : null };
});

// The project when the user owns it or is a collaborator on it, otherwise null.
// A missing project and one the user cannot open look the same to the caller.
export async function findAccessibleProject(
  projectId: string,
  user: CurrentUser
): Promise<WorkspaceProject | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: user.userId }, ...(user.email ? [collaboratorEmail(user.email)] : [])],
    },
    select: { ...projectSummarySelect, ownerId: true },
  });

  if (!project) {
    return null;
  }

  return { id: project.id, name: project.name, isOwner: project.ownerId === user.userId };
}
