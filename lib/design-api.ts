import { startTaskRun, type TaskRunHandle } from "@/lib/task-run-api";

export type DesignRunHandle = TaskRunHandle;

// Starts a design run for the room and returns what the browser needs to follow it. The project
// ID is the room ID, so `roomId` is sent as both (`POST /api/ai/design` requires `projectId`).
export function startDesignRun(prompt: string, roomId: string): Promise<DesignRunHandle> {
  return startTaskRun("/api/ai/design", { prompt, roomId, projectId: roomId });
}
