// Types the whole Liveblocks integration (client hooks and the node SDK) through the global
// `Liveblocks` interface. https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { LiveObject } from "@liveblocks/client";

import type { ShapeColors } from "@/types/canvas";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Canvas position of the pointer, or null when it is outside the canvas.
      cursor: { x: number; y: number } | null;
      // True while the AI is working on behalf of this user.
      isThinking: boolean;
    };

    // The room's Storage root. The canvas itself lives under `flow`, which
    // `useLiveblocksFlow` creates and types on its own, so it is not declared here.
    Storage: {
      // The color picked for each shape in the shape panel, so every node of a shape shares it.
      // Created with the room (`initialStorage` in `canvas-room.tsx`), or on the first pick for
      // a room that predates it, hence optional.
      shapeColors?: LiveObject<ShapeColors>;
    };

    // Set by `POST /api/liveblocks-auth` when the session token is issued.
    UserMeta: {
      // The Clerk user ID.
      id: string;
      info: {
        name: string;
        // Absent when the user has no profile picture (Liveblocks types `avatar` as a string).
        avatar?: string;
        // Cursor color, derived from the user ID (`lib/cursor-color.ts`).
        color: string;
      };
    };
  }
}

export {};
