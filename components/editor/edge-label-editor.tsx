"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

import { EDGE_LABEL_PLACEHOLDER } from "@/types/canvas";

interface EdgeLabelEditorProps {
  // The edge's text when editing started. Later changes to it are not read: the editor keeps its
  // own draft while it is open, so a text changed by someone else mid-edit does not move the caret.
  initialLabel: string;
  // Called once, with the text as typed, when editing ends (Enter, Escape, or the field losing
  // focus). Nothing is written while typing, so the whole edit is one undo step and collaborators
  // see the text when it is done.
  onClose: (label: string) => void;
}

// The inline text editor on an edge, drawn by `CanvasEdgeRenderer` in place of the edge's text.
// One line: Enter ends it, and so does Escape, which keeps what was typed (as in the node label
// editor). It is sized by its text (`field-sizing-content`; a browser without it shows a fixed-width
// field), and styled like the text it replaces so nothing jumps when editing starts or ends.
export function EdgeLabelEditor({ initialLabel, onClose }: EdgeLabelEditorProps) {
  const [draft, setDraft] = useState(initialLabel);
  const inputRef = useRef<HTMLInputElement>(null);
  // Ending the edit unmounts the field, and some browsers fire `blur` for a field that is removed
  // while focused, so a second close would write the same text twice.
  const isClosedRef = useRef(false);

  // Before paint, so the caret is already in the field when it appears. `preventScroll`: React
  // Flow's container is `overflow: hidden`, and the browser would otherwise scroll it to the
  // focused element and shift the canvas.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  function close() {
    if (isClosedRef.current) return;
    isClosedRef.current = true;
    onClose(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // The field is rendered inside the edge in React's tree (through a portal), so React would pass
    // every key on to the edge's own handler, which selects the edge on Enter and Space and
    // deselects it on Escape. Typing is the field's business only.
    event.stopPropagation();

    // Enter or Escape also ends an IME composition; leave that to the browser.
    if ((event.key === "Enter" || event.key === "Escape") && !event.nativeEvent.isComposing) {
      event.preventDefault();
      close();
    }
  }

  return (
    // `nodrag nopan nowheel` keep React Flow from dragging, panning, or zooming while the user
    // selects text in the field.
    <input
      ref={inputRef}
      type="text"
      value={draft}
      placeholder={EDGE_LABEL_PLACEHOLDER}
      aria-label="Connection text"
      spellCheck={false}
      className="nodrag nopan nowheel field-sizing-content min-w-16 max-w-48 rounded-xl border border-brand bg-base px-2 py-0.5 text-center text-xs text-copy-primary outline-none select-text placeholder:text-copy-faint"
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={close}
    />
  );
}
