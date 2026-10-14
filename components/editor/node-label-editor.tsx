"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

import { NODE_LABEL_PLACEHOLDER } from "@/types/canvas";

interface NodeLabelEditorProps {
  // The label when editing started. Later changes to it are not read: while typing, the
  // editor shows its own draft, because the synced value comes back a render later and a
  // controlled textarea fed from it would jump the caret and drop fast keystrokes.
  initialLabel: string;
  // Called with the full text on every change, so the label updates as the user types.
  onChange: (label: string) => void;
  // Called on blur and on Escape.
  onClose: () => void;
}

// The inline label editor, rendered by `CanvasShape` in place of the label text. A textarea
// cannot center its text vertically, so a hidden copy of the text sits in the same grid cell:
// it gives the cell the text's height, the label box centers the cell, and the textarea fills
// it. Both share the label's typography, so the text does not move when editing starts or ends.
export function NodeLabelEditor({ initialLabel, onChange, onClose }: NodeLabelEditorProps) {
  const [draft, setDraft] = useState(initialLabel);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Before paint, so the caret is already in the node when it appears. `preventScroll`: React
  // Flow's container is `overflow: hidden`, and the browser would otherwise scroll it to the
  // focused element and shift the canvas.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Escape also ends an IME composition; leave that to the browser.
    if (event.key === "Escape" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)]">
      {/* The trailing space gives a final empty line its height. */}
      <div
        aria-hidden
        className="invisible col-start-1 row-start-1 whitespace-pre-wrap wrap-anywhere"
      >
        {`${draft || NODE_LABEL_PLACEHOLDER} `}
      </div>
      {/* `nodrag nopan nowheel` keep React Flow from dragging the node, panning, or zooming
          while the user selects text or scrolls inside the field. */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={draft}
        placeholder={NODE_LABEL_PLACEHOLDER}
        aria-label="Node label"
        spellCheck={false}
        className="nodrag nopan nowheel col-start-1 row-start-1 m-0 w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-center whitespace-pre-wrap wrap-anywhere outline-none select-text"
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={onClose}
      />
    </div>
  );
}
