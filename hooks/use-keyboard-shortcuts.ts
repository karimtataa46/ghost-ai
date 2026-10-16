"use client";

import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect } from "react";

import { ZOOM_ANIMATION } from "@/lib/canvas-zoom";
import type { CanvasEdge, CanvasNode, CanvasTool } from "@/types/canvas";

interface KeyboardShortcutsOptions {
  reactFlow: Pick<ReactFlowInstance<CanvasNode, CanvasEdge>, "zoomIn" | "zoomOut">;
  onUndo: () => void;
  onRedo: () => void;
  onToolChange: (tool: CanvasTool) => void;
}

// A key press while typing belongs to the field, not the canvas: text inputs, textareas, and
// anything contenteditable (which `isContentEditable` also reports for a child of an editable
// element). A node's label editor is a textarea, so it keeps its own native undo.
function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.matches("input, textarea");
}

// Canvas keyboard shortcuts, listened for on `window`:
// - `+` or `=` zooms in, `-` zooms out
// - Cmd/Ctrl + Z undoes, Cmd/Ctrl + Shift + Z and Cmd/Ctrl + Y redo
// - `A` switches to the select tool, `H` to the hand (pan) tool; neither touches the selection
// Does nothing while the user is typing in an input, textarea, or editable text.
export function useKeyboardShortcuts({
  reactFlow,
  onUndo,
  onRedo,
  onToolChange,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (event.metaKey || event.ctrlKey) {
        // Alt would make it a different chord, so leave it to the browser.
        if (event.altKey) return;

        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) onRedo();
          else onUndo();
        } else if (key === "y" && !event.shiftKey) {
          event.preventDefault();
          onRedo();
        }
        return;
      }

      // Plain keys only: Cmd/Ctrl + `+` / `-` is the browser's page zoom, Cmd/Ctrl + `A` selects
      // the page's text, and Alt chords are not ours. Shift is allowed because `+` is Shift + `=`
      // on many keyboards (and Caps Lock or Shift makes the key `A` or `H`).
      if (event.altKey) return;

      if (key === "+" || key === "=") {
        event.preventDefault();
        reactFlow.zoomIn(ZOOM_ANIMATION);
      } else if (key === "-") {
        event.preventDefault();
        reactFlow.zoomOut(ZOOM_ANIMATION);
      } else if (key === "a") {
        event.preventDefault();
        onToolChange("select");
      } else if (key === "h") {
        event.preventDefault();
        onToolChange("pan");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reactFlow, onUndo, onRedo, onToolChange]);
}
