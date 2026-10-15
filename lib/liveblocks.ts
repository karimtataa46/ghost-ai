import { Liveblocks } from "@liveblocks/node";

const globalForLiveblocks = globalThis as unknown as { liveblocks?: Liveblocks };

// The server-side Liveblocks client, created on first use and then reused (also across hot
// reloads). It is created lazily so a missing secret fails the request that needs it rather
// than every module that imports this file, including `next build`.
export function getLiveblocks(): Liveblocks {
  if (!globalForLiveblocks.liveblocks) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;

    if (!secret) {
      throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
    }

    globalForLiveblocks.liveblocks = new Liveblocks({ secret });
  }

  return globalForLiveblocks.liveblocks;
}
