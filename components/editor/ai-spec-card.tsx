"use client";

import { Download, FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { specDownloadUrl } from "@/lib/spec-api";
import { formatSpecDate } from "@/lib/spec-date";
import { cn } from "@/lib/utils";
import type { ProjectSpecSummary } from "@/types/spec";

interface AiSpecCardProps {
  projectId: string;
  spec: ProjectSpecSummary;
  // Called when the card is clicked, to preview the spec.
  onSelect: (spec: ProjectSpecSummary) => void;
}

// One generated spec: its filename and creation time. Clicking the card previews it; the download
// button is a link to the download route, so the browser saves the file itself. The two are
// siblings, since a button cannot sit inside a button.
export function AiSpecCard({ projectId, spec, onSelect }: AiSpecCardProps) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-surface-border bg-elevated transition-colors hover:bg-subtle has-[:focus-visible]:border-brand">
      <button
        type="button"
        onClick={() => onSelect(spec)}
        title="Preview"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl p-3 pr-1 text-left outline-none"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
          <FileText className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-sm font-medium wrap-anywhere text-copy-primary">
            {spec.filename}
          </span>
          <time dateTime={spec.createdAt} className="block text-xs text-copy-muted">
            {formatSpecDate(spec.createdAt)}
          </time>
        </span>
      </button>
      <a
        href={specDownloadUrl(projectId, spec.id)}
        download={spec.filename}
        aria-label={`Download ${spec.filename}`}
        title="Download"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "mr-3 text-copy-muted hover:text-copy-primary"
        )}
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}
