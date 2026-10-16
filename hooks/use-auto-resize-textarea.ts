"use client";

import { useLayoutEffect, type RefObject } from "react";

// Grows a textarea with its content. The element's CSS `min-height` and `max-height` clamp the
// result, so past the maximum it scrolls instead of growing. `value` is only the trigger to
// re-measure.
export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
) {
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;

    // Reset first so the height can shrink again when text is deleted.
    textarea.style.height = "auto";
    // `scrollHeight` leaves out the border, and the height we set includes it (border-box).
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + borders}px`;
  }, [ref, value]);
}
