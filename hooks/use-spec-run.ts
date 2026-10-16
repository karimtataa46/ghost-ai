"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import { ProjectApiError } from "@/lib/project-api";
import { startSpecRun, type SpecRunInput } from "@/lib/spec-api";
import type { TaskRunHandle } from "@/lib/task-run-api";
import type { generateSpec } from "@/trigger/generate-spec";

const STARTING_MESSAGE = "Starting...";
const READY_MESSAGE = "The spec is ready.";
const FAILED_MESSAGE = "Something went wrong while writing the spec. Try again.";
const LOST_RUN_MESSAGE = "Lost track of the spec run. Check the list in a moment.";

export interface SpecRunOutcome {
  kind: "success" | "error";
  message: string;
}

interface UseSpecRunOptions {
  // Called once when a run you started has ended (or could not start): the spec is saved, or why
  // not. On success the caller reloads its list.
  onFinished?: (outcome: SpecRunOutcome) => void;
}

interface SpecRun {
  // Starts a run. Resolves to whether it started; if not, `outcome` already has the reason.
  start: (input: SpecRunInput) => Promise<boolean>;
  // True from the moment a run is requested until it has finished, failed, or been lost.
  isActive: boolean;
  // The line the run last reported ("Writing the spec", ...) while it is active, else null.
  progress: string | null;
  // How the latest run ended, until the next one starts. Null before the first run.
  outcome: SpecRunOutcome | null;
}

function readMessage(metadata: unknown): string | null {
  if (typeof metadata !== "object" || metadata === null || !("message" in metadata)) return null;
  const message = metadata.message;
  return typeof message === "string" && message.trim() !== "" ? message : null;
}

// Runs spec generation as a background task and follows it with `useRealtimeRun` and a token that
// can read only that run. The task saves the spec itself (Blob + `ProjectSpec`); this only tracks
// the run, so the button can lock while it works and say how it ended. Only the person who started
// the run follows it. Everyone's list picks the spec up the next time it is read.
//
// Whether the run is active and how it ended are worked out from the run each render rather than
// stored, so a finished run can never be mistaken for the next one.
export function useSpecRun({ onFinished }: UseSpecRunOptions = {}): SpecRun {
  const [isStarting, setIsStarting] = useState(false);
  const [handle, setHandle] = useState<TaskRunHandle | null>(null);
  // Why the latest start was refused (the route's message), when it was.
  const [startError, setStartError] = useState<string | null>(null);
  // A ref as well as state, so a second start in the same tick is refused.
  const isBusyRef = useRef(false);
  const notifiedRunRef = useRef<string | null>(null);

  // The latest callback, so the effect below runs on the run's changes only.
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  const { run: followedRun, error } = useRealtimeRun<typeof generateSpec>(handle?.runId, {
    accessToken: handle?.publicToken,
    enabled: handle !== null,
  });
  // The hook can still hold the previous run's data for a render after the handle changes.
  const run = handle && followedRun?.id === handle.runId ? followedRun : undefined;

  let runOutcome: SpecRunOutcome | null = null;
  if (handle) {
    if (run?.isSuccess) {
      runOutcome = { kind: "success", message: READY_MESSAGE };
    } else if (run?.isCompleted) {
      // Failed, cancelled, expired, or timed out. The task reports a user-safe reason in its
      // metadata and throws the same line, so no provider detail is shown.
      runOutcome = { kind: "error", message: readMessage(run.metadata) ?? FAILED_MESSAGE };
    } else if (error) {
      runOutcome = { kind: "error", message: LOST_RUN_MESSAGE };
    }
  }

  const runId = handle?.runId ?? null;
  useEffect(() => {
    if (runId === null || runOutcome === null || notifiedRunRef.current === runId) return;

    notifiedRunRef.current = runId;
    isBusyRef.current = false;
    onFinishedRef.current?.(runOutcome);
  }, [runId, runOutcome]);

  const start = useCallback(async (input: SpecRunInput) => {
    if (isBusyRef.current) return false;
    isBusyRef.current = true;
    setIsStarting(true);
    setStartError(null);
    // Let go of the previous run, so its result is not shown against this one.
    setHandle(null);

    try {
      setHandle(await startSpecRun(input));
      return true;
    } catch (caught) {
      isBusyRef.current = false;
      const message =
        caught instanceof ProjectApiError ? caught.message : "Could not start the spec.";
      setStartError(message);
      onFinishedRef.current?.({ kind: "error", message });
      return false;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const isActive = isStarting || (handle !== null && runOutcome === null);
  const outcome: SpecRunOutcome | null = isStarting
    ? null
    : startError !== null
      ? { kind: "error", message: startError }
      : runOutcome;

  return {
    start,
    isActive,
    progress: isActive ? (readMessage(run?.metadata) ?? STARTING_MESSAGE) : null,
    outcome,
  };
}
