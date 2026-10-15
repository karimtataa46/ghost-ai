"use client";

import { Check, CircleAlert, LoaderCircle, Save } from "lucide-react";

import type { CanvasSaveControls } from "@/components/editor/canvas-save-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CanvasSaveStatus } from "@/types/canvas";

const STATUS_LABELS: Record<CanvasSaveStatus, string> = {
  idle: "Save",
  saving: "Saving...",
  saved: "Saved",
  error: "Save failed",
};

const STATUS_ICONS = {
  idle: Save,
  saving: LoaderCircle,
  saved: Check,
  error: CircleAlert,
} satisfies Record<CanvasSaveStatus, typeof Save>;

interface CanvasSaveButtonProps {
  // The mounted canvas's save state, or `null` while there is no canvas (loading, or a failed
  // connection), when the button is disabled.
  controls: CanvasSaveControls | null;
}

// The navbar's Save button, which also shows where autosave is: saving, saved, or failed. Pressing
// it saves right away, and after a failure it tries again. The label hides below `sm` like the
// other navbar buttons, so the icon carries the state. A button's children are not exposed to
// assistive technology, so the live region that announces changes sits beside it.
export function CanvasSaveButton({ controls }: CanvasSaveButtonProps) {
  const status = controls?.status ?? "idle";
  const Icon = STATUS_ICONS[status];
  const label = STATUS_LABELS[status];
  const detail = status === "error" ? (controls?.error ?? null) : null;
  const description = detail ? `${label}: ${detail}` : label;

  return (
    <>
      <Button
        variant="outline"
        aria-label={description}
        title={detail ?? undefined}
        disabled={!controls?.onSave || status === "saving"}
        onClick={controls?.onSave ?? undefined}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            status === "saving" && "animate-spin",
            status === "saved" && "text-state-success",
            status === "error" && "text-state-error",
          )}
        />
        <span className="hidden sm:inline">{label}</span>
      </Button>
      <span role="status" className="sr-only">
        {description}
      </span>
    </>
  );
}
