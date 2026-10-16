"use client";

import type { KeyboardEvent, RefObject } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  // Owned by the parent so it can move focus here, for example after a starter prompt.
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

// The message composer: a textarea that grows from 72px to 160px, and a send button.
export function AiChatInput({ value, onChange, onSubmit, textareaRef }: AiChatInputProps) {
  useAutoResizeTextarea(textareaRef, value);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends and Shift+Enter adds a line break. The Enter that confirms an IME
    // composition (Arabic, Chinese, Japanese input) belongs to the IME, so it is left alone.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex shrink-0 items-end gap-2 pt-3"
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the system you want to design..."
        aria-label="Message Ghost AI"
        rows={1}
        // `field-sizing-fixed` hands sizing to the hook; the Textarea default sizes by CSS,
        // which not every browser supports. `text-sm` replaces the Textarea's `text-base`,
        // which in this project is a color (see ui-context.md).
        className="field-sizing-fixed max-h-40 min-h-18 resize-none text-sm text-copy-primary"
      />
      <Button
        type="submit"
        size="icon-lg"
        aria-label="Send message"
        disabled={value.trim().length === 0}
        className="bg-ai text-white hover:bg-ai/90"
      >
        <SendHorizontal className="h-5 w-5" />
      </Button>
    </form>
  );
}
