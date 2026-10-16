import { del, get, list, put } from "@vercel/blob";

import { prisma } from "@/lib/prisma";

// Spec Markdown lives in Vercel Blob; Prisma keeps only the blob URL (`ProjectSpec.filePath`), the
// same split as the canvas (`lib/canvas-storage.ts`). Private, because a spec is project data: it
// is served only through the download route, which checks that the user can open the project.
// Specs share the canvas's Blob store, so this has to match how that store was created (a public
// store rejects private uploads, and the other way around).
const SPEC_BLOB_ACCESS = "private";

// One blob per spec (`specs/{projectId}/{specId}.md`). Unlike the canvas, a save never replaces an
// earlier one: every generation is a new spec with its own ID.
function specPathname(projectId: string, specId: string) {
  return `specs/${projectId}/${specId}.md`;
}

// Removes blobs by URL. Failures are logged and swallowed: callers use this after their own write
// (or failure) is already decided, and a leftover blob must not change the outcome.
async function deleteBlobs(urls: string[]) {
  if (urls.length === 0) {
    return;
  }

  try {
    await del(urls);
  } catch (error) {
    console.error("Could not delete spec blobs", error);
  }
}

// Uploads the Markdown, then records it against the project. Returns the new spec's ID and
// creation time. Throws when the upload or the insert fails (e.g. the project was deleted, so the
// foreign key is refused); a blob that nothing points at is removed first.
export async function saveSpec(
  projectId: string,
  markdown: string
): Promise<{ id: string; createdAt: Date }> {
  // The ID has to exist before the upload, because it is part of the blob's path, so it is not
  // left to the schema's `cuid()` default.
  const id = crypto.randomUUID();

  const blob = await put(specPathname(projectId, id), markdown, {
    access: SPEC_BLOB_ACCESS,
    contentType: "text/markdown; charset=utf-8",
    addRandomSuffix: false,
  });

  try {
    return await prisma.projectSpec.create({
      data: { id, projectId, filePath: blob.url },
      select: { id: true, createdAt: true },
    });
  } catch (error) {
    // The blob is new, so no other row can point at it: whatever the reason the insert failed,
    // nothing references it now.
    await deleteBlobs([blob.url]);

    throw error;
  }
}

// The most specs one listing returns. Every generation adds a spec and nothing removes one, so the
// list is bounded; the newest are the ones people look for.
const MAX_LISTED_SPECS = 100;

// A project's specs, newest first. Metadata only: `filePath` (the blob URL) is not selected, so it
// cannot reach a response by accident.
export function listProjectSpecs(projectId: string) {
  return prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: MAX_LISTED_SPECS,
    select: { id: true, createdAt: true },
  });
}

// The spec's metadata when it belongs to this project, otherwise null. A spec of another project
// and a spec that does not exist look the same to the caller.
export function findProjectSpec(projectId: string, specId: string) {
  return prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { filePath: true, createdAt: true },
  });
}

// The spec file as a stream, or null when the blob is gone. It deliberately carries no size:
// `get` reports the upstream response's `Content-Length`, which is absent (so `0`) when Blob
// answers chunked or compressed, as it does for anything but a tiny file. A caller that sent that
// as its own `Content-Length` would make the browser read an empty or cut-off file.
export async function openSpecFile(filePath: string) {
  // Specs are never overwritten, so a cached copy is never stale and the CDN can serve it.
  const blob = await get(filePath, { access: SPEC_BLOB_ACCESS });

  if (!blob || blob.statusCode !== 200) {
    return null;
  }

  return { stream: blob.stream };
}

// Removes every spec blob of a project, e.g. when the project is deleted (the rows go with the
// project, by cascade). Found by path rather than from the rows, so a spec saved while the delete
// was running is covered too. Failures are logged and swallowed, like `deleteCanvasBlob`.
export async function deleteProjectSpecBlobs(projectId: string) {
  try {
    const urls: string[] = [];
    let cursor: string | undefined;

    do {
      // The trailing slash keeps project `a` from matching the specs of project `a-b`.
      const page = await list({ prefix: `specs/${projectId}/`, cursor });

      urls.push(...page.blobs.map((blob) => blob.url));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    await deleteBlobs(urls);
  } catch (error) {
    console.error("Could not list spec blobs", error);
  }
}
