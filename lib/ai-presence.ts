import { logger } from "@trigger.dev/sdk";

import { getLiveblocks } from "@/lib/liveblocks";
import { AI_SENDER } from "@/types/tasks";

// The design agent's identity in a room. It is not a Clerk user, so it cannot collide with a
// person; clients already draw anyone in `others` (avatar group and live cursor).
export const AI_USER_ID: string = AI_SENDER.id;

const AI_USER_INFO = {
  name: "Ghost AI",
  // `--accent-ai-text` in `app/globals.css`.
  color: "#8b82ff",
};

// Presence set through the REST API expires on its own, so a crashed task cannot leave the AI
// "in" the room. It lives for `PRESENCE_TTL_SECONDS` and is renewed every
// `HEARTBEAT_INTERVAL_MS` while the task runs (a model call can take longer than the TTL).
const PRESENCE_TTL_SECONDS = 30;
const HEARTBEAT_INTERVAL_MS = 10_000;
// The shortest TTL Liveblocks allows: how long the AI lingers after `clear()`.
const CLEAR_TTL_SECONDS = 2;

interface AiPresenceState {
  cursor: { x: number; y: number } | null;
  thinking: boolean;
}

export interface AiPresence {
  // Starts showing the AI in the room and keeps it there until `clear()`.
  start: () => Promise<void>;
  // Changes part of the AI's presence (the cursor in canvas coordinates, or the thinking flag).
  update: (patch: Partial<AiPresenceState>) => Promise<void>;
  // Takes the AI out of the room: no cursor, not thinking, and it expires within seconds.
  clear: () => Promise<void>;
}

// The AI's cursor and thinking state in one room. Presence is cosmetic, so a failed send is
// logged and never stops the run.
export function createAiPresence(roomId: string): AiPresence {
  let state: AiPresenceState = { cursor: null, thinking: false };
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  async function send(next: AiPresenceState, ttl: number) {
    try {
      await getLiveblocks().setPresence(roomId, {
        userId: AI_USER_ID,
        data: { cursor: next.cursor, thinking: next.thinking },
        userInfo: AI_USER_INFO,
        ttl,
      });
    } catch (error) {
      logger.warn("Could not update AI presence", { roomId, error: String(error) });
    }
  }

  return {
    async start() {
      state = { cursor: null, thinking: true };
      await send(state, PRESENCE_TTL_SECONDS);

      heartbeat = setInterval(() => {
        void send(state, PRESENCE_TTL_SECONDS);
      }, HEARTBEAT_INTERVAL_MS);
    },

    async update(patch) {
      state = { ...state, ...patch };
      await send(state, PRESENCE_TTL_SECONDS);
    },

    async clear() {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }

      state = { cursor: null, thinking: false };
      await send(state, CLEAR_TTL_SECONDS);
    },
  };
}
