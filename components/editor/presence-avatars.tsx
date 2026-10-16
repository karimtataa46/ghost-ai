"use client";

import { UserButton } from "@clerk/nextjs";

import {
  ParticipantAvatar,
  ParticipantOverflow,
} from "@/components/editor/participant-avatar";
import { useRoomParticipants } from "@/hooks/use-room-participants";

// How many collaborator avatars show before the rest collapse into a `+N` chip.
const MAX_VISIBLE_AVATARS = 5;

// Who is in the canvas, in its top-right corner: the other people as an overlapping stack, then
// you as Clerk's own `UserButton` (never a presence avatar, so you are not listed twice). The
// divider appears only when someone else is here; alone, it is just the `UserButton`. Must
// render under a `RoomProvider`, as a sibling of the canvas rather than inside its Suspense
// boundary, so the `UserButton` is there while the room connects and if the connection fails.
export function PresenceAvatars() {
  const collaborators = useRoomParticipants();
  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = collaborators.length - visible.length;

  return (
    // The row lets pointer events through so it never blocks the canvas under it; only the
    // `UserButton` turns them back on. The avatars are display only.
    <div className="pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-3">
      {collaborators.length > 0 && (
        <>
          <ul aria-label="Collaborators in this canvas" className="flex -space-x-1.5">
            {visible.map((participant) => (
              <li key={participant.id}>
                <ParticipantAvatar participant={participant} />
              </li>
            ))}
            {overflow > 0 && (
              <li>
                <ParticipantOverflow count={overflow} />
              </li>
            )}
          </ul>
          <div
            role="separator"
            aria-orientation="vertical"
            className="h-5 w-px bg-surface-border-subtle"
          />
        </>
      )}
      <div className="pointer-events-auto">
        <UserButton />
      </div>
    </div>
  );
}
