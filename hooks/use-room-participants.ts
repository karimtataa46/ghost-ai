"use client";

import { useAuth } from "@clerk/nextjs";
import { shallow, useOthersMapped } from "@liveblocks/react";
import { useMemo } from "react";

import type { Participant } from "@/types/presence";

// The other people in the room, for the avatar group. "Other" is decided by the Clerk session,
// not the Liveblocks connection: the same person with a second tab open is a second connection
// in `others`, but not a collaborator. Each person appears once however many tabs they have, and
// the list is empty until Clerk has loaded, so the viewer's own tabs never flash in.
//
// Uses the plain hooks, not the Suspense ones, so the group can render outside the canvas's
// Suspense boundary and stay on screen while the room connects. They return an empty list
// until the connection is up.
export function useRoomParticipants(): Participant[] {
  const { isLoaded, userId } = useAuth();
  // Maps only the fields the group shows, so a cursor move does not re-render it.
  const others = useOthersMapped(
    (other) => ({ id: other.id, name: other.info.name, avatar: other.info.avatar }),
    shallow,
  );

  return useMemo(() => {
    if (!isLoaded) {
      return [];
    }

    const seen = new Set<string>();
    const participants: Participant[] = [];

    for (const [, participant] of others) {
      if (participant.id === userId || seen.has(participant.id)) {
        continue;
      }

      seen.add(participant.id);
      participants.push(participant);
    }

    return participants;
  }, [others, isLoaded, userId]);
}
