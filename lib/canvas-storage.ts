import { del, get, put } from "@vercel/blob";

import { parseCanvasSnapshot } from "@/lib/canvas-snapshot";
import { prisma } from "@/lib/prisma";
import { isRecordNotFound } from "@/lib/projects";
import type { CanvasSnapshot } from "@/types/canvas";

// Canvas JSON lives in Vercel Blob; Prisma keeps only the blob URL (`Project.canvasJsonPath`).
// Private, because the canvas is project data: it is served only through the canvas route, which
// checks that the user can open the project. This has to match how the Blob store was created; a
// public store rejects private uploads (and the other way around).
const CANVAS_BLOB_ACCESS = "private";

// One blob per project at a fixed path, overwritten on every save (`canvas/{projectId}.json`).
function canvasPathname(projectId: string) {
  return `canvas/${projectId}.json`;
}

// Uploads the snapshot, then points the project at it. Returns when the project row was updated.
// Throws a Prisma `P2025` (see `isRecordNotFound`) when the project no longer exists.
export async function saveCanvas(projectId: string, snapshot: CanvasSnapshot): Promise<Date> {
  const blob = await put(canvasPathname(projectId), JSON.stringify(snapshot), {
    access: CANVAS_BLOB_ACCESS,
    contentType: "application/json",
    // The path is the project's, so a save replaces the last one instead of adding a new blob.
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
      select: { updatedAt: true },
    });

    return project.updatedAt;
  } catch (error) {
    // The project was deleted after the access check and before this write: nothing points at the
    // blob any more, so do not leave it behind.
    if (isRecordNotFound(error)) {
      await deleteCanvasBlob(blob.url);
    }

    throw error;
  }
}

// The project's saved canvas, or null when it has none: nothing was saved yet, or the blob the
// project points at is gone. Throws when the stored JSON is not a valid canvas.
export async function loadCanvas(projectId: string): Promise<CanvasSnapshot | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project?.canvasJsonPath) {
    return null;
  }

  // Skip the CDN: the blob is overwritten on every save, so a cached copy could be an old canvas.
  const blob = await get(project.canvasJsonPath, { access: CANVAS_BLOB_ACCESS, useCache: false });

  if (!blob || blob.statusCode !== 200) {
    return null;
  }

  const snapshot = parseCanvasSnapshot(JSON.parse(await new Response(blob.stream).text()));

  if (!snapshot) {
    throw new Error(`The saved canvas for project ${projectId} is not valid`);
  }

  return snapshot;
}

// Removes a project's canvas blob, e.g. when the project is deleted. Deleting a blob that does
// not exist is not an error. Failures are logged and swallowed: callers use this after their own
// write succeeded, and a leftover blob must not turn that into a failure.
export async function deleteCanvasBlob(url: string) {
  try {
    await del(url);
  } catch (error) {
    console.error("Could not delete a canvas blob", error);
  }
}
