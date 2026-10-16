"use client";

import { useState } from "react";
import { useRoom } from "@liveblocks/react";
import { FilePlus2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useAiThinking } from "@/hooks/use-ai-thinking";
import { useSpecRun } from "@/hooks/use-spec-run";
import { readSpecCanvas } from "@/lib/spec-canvas";

const EMPTY_CANVAS_MESSAGE = "Add at least one component to the canvas before generating a spec.";
const READ_FAILED_MESSAGE = "Could not read the canvas. Try again.";

interface SpecGenerateSectionProps {
  // Called when a spec you started has been saved, so the list can load it.
  onGenerated: () => void;
}

// The Generate Spec button and its status line. Pressing it reads the canvas from the room's
// Storage and the conversation from the `ai-chat` feed, and starts the `generate-spec` task with
// them (`useSpecRun`); the task writes the spec and saves it, and the list shows it once it has.
// It is locked while your run is active and while the AI is editing the canvas (`thinking`), so a
// spec is not written from a half-drawn diagram. Must render under a `RoomProvider`, and only once
// the `ai-chat` feed exists (`useAiChatFeedReady`), because it reads that feed.
export function SpecGenerateSection({ onGenerated }: SpecGenerateSectionProps) {
  const room = useRoom();
  const { messages } = useAiChat();
  const isAiWorking = useAiThinking();
  // Why a press did nothing before a run was even requested (an empty canvas, an unreadable one).
  const [notice, setNotice] = useState<string | null>(null);
  const specRun = useSpecRun({
    onFinished: (outcome) => {
      if (outcome.kind === "success") onGenerated();
    },
  });

  async function generate() {
    if (specRun.isActive || isAiWorking) return;
    setNotice(null);

    let canvas;
    try {
      // A snapshot taken now, not a subscription: nothing re-renders as the canvas changes.
      const { root } = await room.getStorage();
      canvas = readSpecCanvas(root.toJSON());
    } catch {
      setNotice(READ_FAILED_MESSAGE);
      return;
    }

    if (canvas.nodes.length === 0) {
      setNotice(EMPTY_CANVAS_MESSAGE);
      return;
    }

    await specRun.start({
      roomId: room.id,
      // The server keeps the newest few and only what it needs of each.
      chatHistory: messages.map(({ role, content }) => ({ role, content })),
      ...canvas,
    });
  }

  const failure = notice ?? (specRun.outcome?.kind === "error" ? specRun.outcome.message : null);
  const isReady = !notice && specRun.outcome?.kind === "success";

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <Button
        size="lg"
        disabled={specRun.isActive || isAiWorking}
        title={isAiWorking && !specRun.isActive ? "Ghost AI is working on the canvas" : undefined}
        onClick={() => void generate()}
        className="w-full bg-ai text-white hover:bg-ai/90"
      >
        {specRun.isActive ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FilePlus2 className="h-4 w-4" />
        )}
        {specRun.isActive ? "Generating..." : "Generate Spec"}
      </Button>
      {specRun.progress && (
        <p role="status" className="text-xs wrap-anywhere text-copy-secondary">
          {specRun.progress}
        </p>
      )}
      {failure && (
        <p role="alert" className="text-xs wrap-anywhere text-state-error">
          {failure}
        </p>
      )}
      {isReady && (
        <p role="status" className="text-xs text-state-success">
          The spec is ready.
        </p>
      )}
    </div>
  );
}
