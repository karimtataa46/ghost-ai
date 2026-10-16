"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import { startDesignRun, type DesignRunHandle } from "@/lib/design-api";
import { ProjectApiError } from "@/lib/project-api";
import type { designAgentTask } from "@/trigger/design-agent";

const DONE_MESSAGE = "Done. I updated the canvas.";
const FAILED_MESSAGE = "Something went wrong while designing. Try again.";
const LOST_RUN_MESSAGE = "Lost track of the design run. Check the canvas to see what changed.";

interface UseDesignRunOptions {
  // The room (and project) to design in.
  roomId: string;
  // Called once per run with the assistant's closing message: the summary, or why it failed.
  // `failure` is the AI status feed's latest error text, when there is one.
  onFinished: (message: string) => void;
  failure: string | null;
}

interface DesignRun {
  // Starts a run for the prompt. Resolves to whether it started; if not, `onFinished` has
  // already been given the reason.
  start: (prompt: string) => Promise<boolean>;
  // True from the moment a run is requested until it has finished, failed, or been lost.
  isActive: boolean;
}

// Runs a design prompt as a background task and follows it. The canvas is not touched here: the
// task edits the room, and Liveblocks shows those edits to everyone. This only tracks the run, so
// the input can lock while it works and the conversation can say how it ended. Only the person who
// started the run follows it, so the closing message is added to the feed once.
export function useDesignRun({ roomId, onFinished, failure }: UseDesignRunOptions): DesignRun {
  const [isStarting, setIsStarting] = useState(false);
  const [handle, setHandle] = useState<DesignRunHandle | null>(null);
  // A ref as well as state, so a second start in the same tick is refused.
  const isBusyRef = useRef(false);
  const finishedRunRef = useRef<string | null>(null);

  // The latest callback and failure text, so the effect below runs on the run's changes only.
  const onFinishedRef = useRef(onFinished);
  const failureRef = useRef(failure);
  useEffect(() => {
    onFinishedRef.current = onFinished;
    failureRef.current = failure;
  });

  const { run, error } = useRealtimeRun<typeof designAgentTask>(handle?.runId, {
    accessToken: handle?.publicToken,
    enabled: handle !== null,
  });

  useEffect(() => {
    if (!handle || finishedRunRef.current === handle.runId) return;

    let message: string | null = null;
    if (run?.isSuccess) {
      const summary = run.output?.summary;
      message = typeof summary === "string" && summary.trim() ? summary : DONE_MESSAGE;
    } else if (run?.isCompleted) {
      // Failed, cancelled, expired, or timed out.
      message = failureRef.current ?? FAILED_MESSAGE;
    } else if (error) {
      message = LOST_RUN_MESSAGE;
    }
    if (message === null) return;

    finishedRunRef.current = handle.runId;
    isBusyRef.current = false;
    setHandle(null);
    onFinishedRef.current(message);
  }, [handle, run, error]);

  const start = useCallback(
    async (prompt: string) => {
      if (isBusyRef.current) return false;
      isBusyRef.current = true;
      setIsStarting(true);

      try {
        setHandle(await startDesignRun(prompt, roomId));
        return true;
      } catch (caught) {
        isBusyRef.current = false;
        onFinishedRef.current(
          caught instanceof ProjectApiError ? caught.message : "Could not start the design.",
        );
        return false;
      } finally {
        setIsStarting(false);
      }
    },
    [roomId],
  );

  return { start, isActive: isStarting || handle !== null };
}
