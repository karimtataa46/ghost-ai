import { parseCanvasSnapshot } from "@/lib/canvas-snapshot";
import { ProjectApiError, jsonRequest, request } from "@/lib/project-api";
import type { CanvasSnapshot } from "@/types/canvas";

function canvasUrl(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/canvas`;
}

// The project's saved canvas, or null when it has none. Throws `ProjectApiError` on a failed
// request or a reply that is not a valid canvas.
export async function loadCanvas(projectId: string): Promise<CanvasSnapshot | null> {
  const body = await request(canvasUrl(projectId), { method: "GET", cache: "no-store" });
  const canvas = typeof body === "object" && body !== null && "canvas" in body ? body.canvas : undefined;

  if (canvas === null) {
    return null;
  }

  const snapshot = parseCanvasSnapshot(canvas);

  if (!snapshot) {
    throw new ProjectApiError("Unexpected response from the server.", 0);
  }

  return snapshot;
}

export async function saveCanvas(projectId: string, snapshot: CanvasSnapshot) {
  await request(canvasUrl(projectId), jsonRequest("PUT", snapshot));
}
