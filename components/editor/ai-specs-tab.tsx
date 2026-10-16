"use client";

import { useState } from "react";
import { useRoom } from "@liveblocks/react";
import { FilePlus2 } from "lucide-react";

import { AiSpecCard } from "@/components/editor/ai-spec-card";
import { SpecGenerateSection } from "@/components/editor/spec-generate-section";
import { SpecPreviewDialog } from "@/components/editor/spec-preview-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiChatFeedReady } from "@/hooks/use-ai-chat-feed-ready";
import { useProjectSpecs } from "@/hooks/use-project-specs";
import type { ProjectSpecSummary } from "@/types/spec";

// The Specs tab: a Generate Spec button above the project's generated specs, newest first. The
// button starts the `generate-spec` task and the list loads the spec once it is saved. A card
// opens a Markdown preview and has a download button. Must render under a `RoomProvider` (the
// project ID is the room ID). Mounted when the tab is opened, so the list loads fresh each time;
// leaving the tab unmounts it, so a run you started keeps going (and its spec lands in the list)
// but this tab stops following it.
export function AiSpecsTab() {
  const projectId = useRoom().id;
  const isFeedReady = useAiChatFeedReady();
  const { specs, loadError, reload } = useProjectSpecs(projectId);
  // The spec being previewed. It stays set after the dialog closes (metadata only, the Markdown
  // lives in the dialog's body) so the title survives the fade-out.
  const [previewSpec, setPreviewSpec] = useState<ProjectSpecSummary | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  function openPreview(spec: ProjectSpecSummary) {
    setPreviewSpec(spec);
    setIsPreviewOpen(true);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {isFeedReady ? (
        <SpecGenerateSection onGenerated={reload} />
      ) : (
        // The generator reads the chat feed, which has to exist first (`useAiChatFeedReady`).
        <Button size="lg" disabled className="w-full shrink-0 bg-ai text-white">
          <FilePlus2 className="h-4 w-4" />
          Generate Spec
        </Button>
      )}

      {loadError ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-xs wrap-anywhere text-state-error">
            {loadError}
          </p>
          <Button variant="outline" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : specs === null ? (
        <p role="status" className="text-xs text-copy-muted">
          Loading specs...
        </p>
      ) : specs.length === 0 ? (
        <p className="text-xs text-copy-muted">No specs yet. Generated specs will appear here.</p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          {/* Padding keeps a card's focus border from being clipped by the scroll area. */}
          <ul aria-label="Specs" className="flex flex-col gap-2 p-0.5">
            {specs.map((spec) => (
              <li key={spec.id}>
                <AiSpecCard projectId={projectId} spec={spec} onSelect={openPreview} />
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      <SpecPreviewDialog
        projectId={projectId}
        spec={previewSpec}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
}
