"use client";

import { useAuth } from "@clerk/nextjs";
import { shallow, useOther, useOthersConnectionIds } from "@liveblocks/react/suspense";
import { useStore, ViewportPortal } from "@xyflow/react";

interface LiveCursorProps {
  connectionId: number;
  // The Clerk user ID of the viewer, whose own cursors (another tab) are not drawn.
  currentUserId: string | null | undefined;
}

// One other participant's pointer: a small arrow in their color with their name on a badge of the
// same color. Subscribes to that one connection only, so a cursor moving re-renders this
// component and nothing else.
function LiveCursor({ connectionId, currentUserId }: LiveCursorProps) {
  const { id, name, color, cursor } = useOther(
    connectionId,
    (other) => ({
      id: other.id,
      name: other.info.name,
      color: other.info.color,
      cursor: other.presence.cursor,
    }),
    shallow,
  );
  // The cursors sit in canvas coordinates, so they pan and zoom with the nodes. Scaling by the
  // inverse of the zoom keeps the pointer and badge the same size on screen.
  const zoom = useStore((state) => state.transform[2]);

  if (!cursor || id === currentUserId) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 origin-top-left transition-transform duration-100 ease-linear"
      style={{ transform: `translate(${cursor.x}px, ${cursor.y}px) scale(${1 / zoom})` }}
    >
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
        <path
          d="M1 1L1 15.5L4.9 12.1L7.9 19L10.9 17.7L7.9 10.9L13 10.9L1 1Z"
          fill={color}
          stroke="var(--bg-base)"
          strokeLinejoin="round"
        />
      </svg>
      {/* The color is vivid, so the text is the near-black page color (`--bg-base`) for contrast. */}
      <span
        className="absolute top-4 left-3 max-w-40 truncate rounded-xl px-2 py-0.5 text-xs font-medium whitespace-nowrap text-[color:var(--bg-base)]"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

// Live cursors of the other people in the room, drawn on the canvas. Renders as a child of
// `ReactFlow`, in its viewport, and inside the canvas's Suspense boundary. The list of
// connections changes only when someone joins or leaves, not as pointers move.
export function LiveCursors() {
  const { isLoaded, userId } = useAuth();
  const connectionIds = useOthersConnectionIds();

  // Until Clerk has loaded the viewer's ID, it cannot be told apart from the others.
  if (!isLoaded) {
    return null;
  }

  return (
    <ViewportPortal>
      {connectionIds.map((connectionId) => (
        <LiveCursor key={connectionId} connectionId={connectionId} currentUserId={userId} />
      ))}
    </ViewportPortal>
  );
}
