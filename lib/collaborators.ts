import { getClerkProfiles } from "@/lib/clerk-profiles";
import { prisma } from "@/lib/prisma";
import type { Collaborator } from "@/types/collaborator";

const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const collaboratorSelect = { id: true, email: true } as const;

interface CollaboratorRow {
  id: string;
  email: string;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
}

// Adds each row's Clerk name and avatar when a Clerk user has that email.
async function withProfiles(rows: CollaboratorRow[]): Promise<Collaborator[]> {
  const profiles = await getClerkProfiles(rows.map((row) => row.email));

  return rows.map(({ id, email }) => {
    const profile = profiles.get(email.toLowerCase());
    return { id, email, name: profile?.name ?? null, imageUrl: profile?.imageUrl ?? null };
  });
}

export async function listCollaborators(projectId: string) {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: collaboratorSelect,
  });

  return withProfiles(rows);
}

// Whether `email` is already a collaborator. Case-insensitive, because access is matched that way.
export async function isCollaborator(projectId: string, email: string) {
  const existing = await prisma.projectCollaborator.findFirst({
    where: { projectId, email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  return existing !== null;
}

// `email` must already be normalized. Throws a Prisma unique violation (P2002) when it is
// already a collaborator, which the route reports as 409.
export async function addCollaborator(projectId: string, email: string) {
  const row = await prisma.projectCollaborator.create({
    data: { projectId, email },
    select: collaboratorSelect,
  });

  const [collaborator] = await withProfiles([row]);
  return collaborator;
}

// Removes one collaborator of the project. False when no such collaborator exists on it.
export async function removeCollaborator(projectId: string, collaboratorId: string) {
  const { count } = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  });

  return count > 0;
}
