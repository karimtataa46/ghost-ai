"use client";

import { Download } from "lucide-react";

import { DialogError } from "@/components/dialogs/dialog-error";
import { DialogShell } from "@/components/dialogs/dialog-shell";
import { SpecMarkdown } from "@/components/editor/spec-markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpecContent } from "@/hooks/use-spec-content";
import { specDownloadUrl } from "@/lib/spec-api";
import { formatSpecDate } from "@/lib/spec-date";
import type { ProjectSpecSummary } from "@/types/spec";

interface SpecPreviewDialogProps {
  projectId: string;
  // The spec to show. The parent keeps it after the dialog closes (only its metadata), so the
  // title does not empty while the dialog fades out.
  spec: ProjectSpecSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Rendered only while the dialog is open, so the Markdown is fetched when it opens and dropped
// when it closes.
function SpecPreviewBody({ projectId, specId }: { projectId: string; specId: string }) {
  const { content, error, reload } = useSpecContent(projectId, specId);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <DialogError message={error} />
        <Button variant="outline" onClick={reload}>
          Try again
        </Button>
      </div>
    );
  }

  if (content === null) {
    return (
      <p role="status" className="text-sm text-copy-muted">
        Loading spec...
      </p>
    );
  }

  if (content.trim() === "") {
    return <p className="text-sm text-copy-muted">This spec is empty.</p>;
  }

  return <SpecMarkdown content={content} />;
}

// Previews one spec as rendered Markdown. The content is read through the download route (never
// from Blob), and the dialog gives Escape to close, a trapped focus, and a focusable scroll area,
// so the text scrolls with the keyboard. Download is the same link the list item has.
export function SpecPreviewDialog({ projectId, spec, open, onOpenChange }: SpecPreviewDialogProps) {
  if (!spec) return null;

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={spec.filename}
      description={`Generated ${formatSpecDate(spec.createdAt)}`}
      // A fixed height with the body filling it, so the header and footer stay put while the
      // text scrolls. The column is `minmax(0, 1fr)`, not the grid's default `auto`: an auto
      // column grows to the widest line of a code block, which pushes the whole dialog wider than
      // itself, and a focus inside it then scrolls the clipped dialog sideways.
      className="h-[min(44rem,calc(100dvh-2rem))] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <a
            href={specDownloadUrl(projectId, spec.id)}
            download={spec.filename}
            className={buttonVariants({ variant: "default" })}
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </>
      }
    >
      <ScrollArea className="min-h-0 rounded-2xl border border-surface-border bg-base/60">
        <div className="p-5">
          {/* Keyed by spec, so opening another spec never shows the previous one's text. */}
          <SpecPreviewBody key={spec.id} projectId={projectId} specId={spec.id} />
        </div>
      </ScrollArea>
    </DialogShell>
  );
}
