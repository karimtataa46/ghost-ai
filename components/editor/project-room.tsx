"use client";

import type { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

interface ProjectRoomProps {
  // The project ID, which is also the Liveblocks room ID.
  roomId: string;
  children: ReactNode;
}

// Joins the project's Liveblocks room for everything under it: the canvas and the AI sidebar,
// which reads the room's presence and AI status feed. Tokens come from
// `POST /api/liveblocks-auth`, which checks that the user can open the project.
export function ProjectRoom({ roomId, children }: ProjectRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {/* Keyed by room so moving between projects starts from a fresh canvas and boundary. */}
      <RoomProvider
        key={roomId}
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
        // The picked shape colors start empty. The canvas's own `flow` key is not listed: the
        // flow hook creates it.
        initialStorage={{ shapeColors: new LiveObject({}) }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
