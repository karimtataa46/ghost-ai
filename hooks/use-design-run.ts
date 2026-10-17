"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import type { LatestAiStatus } from "@/hooks/use-ai-status";
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
  onFinished: (message: string) => void;
  // The AI status feed's latest line. A closing line (`complete` or `error`) newer than the run's
  // start ends the run, and an `error` one says why it failed.
  status: LatestAiStatus | null;
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
export function useDesignRun({ roomId, onFinished, status }: UseDesignRunOptions): DesignRun {
  const [isStarting, setIsStarting] = useState(false);
  const [handle, setHandle] = useState<DesignRunHandle | null>(null);
  // A ref as well as state, so a second start in the same tick is refused.
  const isBusyRef = useRef(false);
  const finishedRunRef = useRef<string | null>(null);
  // The feed's newest line when the run was requested, and whether a line newer than that one that
  // is not a closing line has been seen since. The feed's closing lines up to then belong to
  // earlier runs, so they are not taken for this run's.
  const statusAtStartRef = useRef<string | null>(null);
  const sawProgressRef = useRef(false);

  // The latest callback and status ID, so `start` and the effect below see them without running
  // again for each.
  const onFinishedRef = useRef(onFinished);
  const statusIdRef = useRef(status?.id ?? null);
  useEffect(() => {
    onFinishedRef.current = onFinished;
    statusIdRef.current = status?.id ?? null;
  });

  // `id` is the key the hook keeps its `run` and `error` under. Left out, it is one key per
  // component, so the previous run's finished state is still there when the next run starts, and
  // the effect below would end the new run at once with the old run's outcome.
  const { run, error } = useRealtimeRun<typeof designAgentTask>(handle?.runId, {
    id: handle?.runId,
    accessToken: handle?.publicToken,
    enabled: handle !== null,
  });

  useEffect(() => {
    if (!handle || finishedRunRef.current === handle.runId) return;

    // The run stream pauses while the browser tab is hidden (the realtime client stops on
    // `visibilitychange`), so a run that ends while you look at another tab is not reported until
    // you come back. The status feed comes over the room's connection, which is not paused, and
    // the task writes its closing line before it returns, so that line ends the run too.
    const line = status && status.id !== statusAtStartRef.current ? status.message : null;
    const isClosing = line?.kind === "complete" || line?.kind === "error";
    if (line && !isClosing) sawProgressRef.current = true;
    const closing = isClosing && sawProgressRef.current && line?.text ? line : null;

    let message: string | null = null;
    if (run?.isSuccess) {
      const summary = run.output?.summary;
      message = typeof summary === "string" && summary.trim() ? summary : DONE_MESSAGE;
    } else if (run?.isCompleted) {
      // Failed, cancelled, expired, or timed out.
      message = (line?.kind === "error" && line.text) || FAILED_MESSAGE;
    } else if (closing?.text) {
      message = closing.text;
    } else if (error) {
      message = LOST_RUN_MESSAGE;
    }
    if (message === null) return;

    finishedRunRef.current = handle.runId;
    isBusyRef.current = false;
    setHandle(null);
    onFinishedRef.current(message);
  }, [handle, run, error, status]);

  const start = useCallback(
    async (prompt: string) => {
      if (isBusyRef.current) return false;
      isBusyRef.current = true;
      statusAtStartRef.current = statusIdRef.current;
      sawProgressRef.current = false;
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
