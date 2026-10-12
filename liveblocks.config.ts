// Types the whole Liveblocks integration (client hooks and the node SDK) through the global
// `Liveblocks` interface. https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Canvas position of the pointer, or null when it is outside the canvas.
      cursor: { x: number; y: number } | null;
      // True while the AI is working on behalf of this user.
      isThinking: boolean;
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
