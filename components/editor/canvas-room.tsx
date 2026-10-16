"use client";

import { ClientSideSuspense, useErrorListener } from "@liveblocks/react/suspense";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

import { Canvas } from "@/components/editor/canvas";
import { PresenceAvatars } from "@/components/editor/presence-avatars";

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

// Renders the canvas inside the project's Liveblocks room, which `ProjectRoom` provides (mounted
// by `WorkspaceShell`, so the AI sidebar shares the room).
export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    // The canvas area, positioned so the participant group can sit in its top-right corner.
    <div className="relative flex min-h-0 flex-1 flex-col">
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
          <Canvas projectId={roomId} />
        </ClientSideSuspense>
      </ErrorBoundary>
      {/* Beside the boundary, not in it, so the user menu stays while loading or after an error. */}
      <PresenceAvatars />
    </div>
  );
}
