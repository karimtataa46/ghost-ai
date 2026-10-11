"use client";

import { Check, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DialogError } from "@/components/dialogs/dialog-error";
import { Button } from "@/components/ui/button";

const COPIED_FEEDBACK_MS = 2000;

interface CopyLinkButtonProps {
  // The workspace path to copy, e.g. `/editor/<roomId>`; the origin is added when copying.
  path: string;
}

export function CopyLinkButton({ path }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    []
  );

  async function handleCopy() {
    try {
      // `navigator.clipboard` only exists in secure contexts (https or localhost).
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    } catch {
      setError("Could not copy the link. Copy it from the address bar instead.");
      return;
    }

    setError(null);
    setCopied(true);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:items-end">
      <Button type="button" variant="outline" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        <span aria-live="polite">{copied ? "Copied!" : "Copy link"}</span>
      </Button>
      <DialogError message={error} />
    </div>
  );
}
