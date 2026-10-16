"use client";

import type { KeyboardEvent, RefObject } from "react";
import { Loader2, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  // Owned by the parent so it can move focus here, for example after a starter prompt.
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  // True while a design run is active: the textarea is disabled and the send button shows a spinner.
  isGenerating?: boolean;
  // True while a message is being sent to the room: the textarea stays editable (so it keeps
  // focus), but the send button shows a spinner and a second send is ignored.
  isSending?: boolean;
}

// The message composer: a textarea that grows from 72px to 160px, and a send button. Both are
// locked while the AI is generating, and sending is locked while a message is on its way.
export function AiChatInput({
  value,
  onChange,
  onSubmit,
  textareaRef,
  isGenerating = false,
  isSending = false,
}: AiChatInputProps) {
  const isBusy = isGenerating || isSending;
  useAutoResizeTextarea(textareaRef, value);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends and Shift+Enter adds a line break. The Enter that confirms an IME
    // composition (Arabic, Chinese, Japanese input) belongs to the IME, so it is left alone.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!isBusy) onSubmit();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!isBusy) onSubmit();
      }}
      className="flex shrink-0 items-end gap-2 pt-3"
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isGenerating}
        placeholder={isGenerating ? "Ghost AI is working..." : "Describe the system you want to design..."}
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
        aria-label={isGenerating ? "Ghost AI is working" : isSending ? "Sending message" : "Send message"}
        aria-busy={isBusy}
        disabled={isBusy || value.trim().length === 0}
        // A disabled button fades; the green accent stays so the spinner still reads as a run.
        className="bg-chat text-[color:var(--bg-base)] hover:bg-chat/90 disabled:opacity-50"
      >
        {isBusy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <SendHorizontal className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
}
