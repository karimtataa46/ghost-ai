"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
} from "@liveblocks/react/suspense";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

import { Canvas } from "@/components/editor/canvas";

interface CanvasRoomProps {
  // The project ID, which is also the Liveblocks room ID.
  roomId: string;
}

interface CanvasStatusProps {
  title: string;
  description: string;
  role: "status" | "alert";
}

// Fills the canvas area with a short message, for the loading and error states.
function CanvasStatus({ title, description, role }: CanvasStatusProps) {
  return (
    <div role={role} className="flex flex-1 items-center justify-center bg-base px-4 py-8">
      <div className="flex max-w-sm flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-copy-secondary">{title}</p>
        <p className="text-sm text-copy-muted">{description}</p>
      </div>
    </div>
  );
}

// Liveblocks reports a failed connection (auth rejected, no access to the room, room ID
// changed) through an event, not by throwing, so forward it to the error boundary. It only
// fires once the client has given up, not while it is still retrying a dropped connection.
function ConnectionErrorListener() {
  const { showBoundary } = useErrorBoundary();

  useErrorListener((error) => {
    if (error.context.type === "ROOM_CONNECTION_ERROR") {
      showBoundary(error);
    }
  });

  return null;
}

// Joins the project's Liveblocks room and renders the canvas inside it. Tokens come from
// `POST /api/liveblocks-auth`, which checks that the user can open the project.
export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {/* Keyed by room so moving between projects starts from a fresh canvas and boundary. */}
      <RoomProvider key={roomId} id={roomId} initialPresence={{ cursor: null, isThinking: false }}>
        <ErrorBoundary
          fallback={
            <CanvasStatus
              role="alert"
              title="Could not connect to the canvas"
              description="Reload the page to try again. If it keeps failing, you may no longer have access to this project."
            />
          }
        >
          {/* Outside the Suspense boundary: effects of a suspended subtree do not run. */}
          <ConnectionErrorListener />
          <ClientSideSuspense
            fallback={
              <CanvasStatus
                role="status"
                title="Loading canvas..."
                description="Connecting to your project."
              />
            }
          >
            <Canvas />
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
