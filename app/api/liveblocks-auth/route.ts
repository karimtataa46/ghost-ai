import { errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCursorColor } from "@/lib/cursor-color";
import { getLiveblocks } from "@/lib/liveblocks";
import { findAccessibleProject, getCurrentUser } from "@/lib/project-access";
import { readJsonObject } from "@/lib/request-body";

// Liveblocks calls this with `{ room }` when a client joins a room. The project ID is the room
// ID, so the owner or a collaborator of that project gets a token for exactly that room.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request);
  const roomId = typeof body?.room === "string" ? body.room : "";

  if (!roomId) {
    return errorResponse(400, "room is required");
  }

  // A missing project and one the user may not open get the same answer.
  const project = await findAccessibleProject(roomId, user);

  if (!project) {
    return errorResponse(403, "You don't have access to this project");
  }

  const liveblocks = getLiveblocks();

  // Private room (no default access); a no-op when it already exists.
  await liveblocks.getOrCreateRoom(project.id, { defaultAccesses: [] });

  const session = liveblocks.prepareSession(user.userId, {
    userInfo: {
      name: user.name ?? user.email ?? "Anonymous",
      avatar: user.imageUrl ?? undefined,
      color: getCursorColor(user.userId),
    },
  });

  // Owners and collaborators both edit; the token covers this one room only.
  session.allow(project.id, ["*:write"]);

  const { status, body: token } = await session.authorize();

  return new Response(token, { status, headers: { "Content-Type": "application/json" } });
}
