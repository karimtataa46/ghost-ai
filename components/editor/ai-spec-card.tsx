import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AiSpecCardProps {
  title: string;
  snippet: string;
}

// One generated spec. Download is disabled until specs are real files.
export function AiSpecCard({ title, snippet }: AiSpecCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-surface-border bg-elevated p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
        <FileText className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium wrap-anywhere text-copy-primary">{title}</h3>
        <p className="text-xs text-copy-muted">Demo spec</p>
        <p className="mt-1.5 line-clamp-3 text-xs text-copy-secondary">{snippet}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled
        aria-label={`Download ${title}`}
        className="text-copy-muted"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
