"use client";

import { Import } from "lucide-react";

import { DialogShell } from "@/components/dialogs/dialog-shell";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/components/editor/starter-templates";
import { TemplatePreview } from "@/components/editor/template-preview";
import { Button } from "@/components/ui/button";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called with the chosen template, just before the modal closes. What importing does to the
  // canvas is the caller's business.
  onImport: (template: CanvasTemplate) => void;
}

// A dialog listing the starter templates as cards: a preview of the diagram, its name and
// description, and an Import button. The grid scrolls on its own so the header stays in view.
export function StarterTemplatesModal({ open, onOpenChange, onImport }: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template);
    onOpenChange(false);
  }

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Starter templates"
      description="Start from a ready-made diagram. Importing replaces everything on the current canvas."
      className="sm:max-w-3xl"
    >
      {/* Padded so the focus outline of a card's button is not clipped by the scroll area. */}
      <ul className="grid max-h-[min(32rem,60dvh)] gap-4 overflow-y-auto p-1 sm:grid-cols-2">
        {CANVAS_TEMPLATES.map((template) => (
          <li
            key={template.id}
            className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-elevated/60 p-3"
          >
            <TemplatePreview template={template} />
            <div className="flex flex-1 flex-col gap-1 px-1">
              <h3 className="text-sm font-medium text-copy-primary">{template.name}</h3>
              <p className="text-xs text-copy-muted">{template.description}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-label={`Import ${template.name}`}
              onClick={() => handleImport(template)}
              className="w-full"
            >
              <Import className="h-4 w-4" />
              Import
            </Button>
          </li>
        ))}
      </ul>
    </DialogShell>
  );
}
