"use client";

import { DialogShell } from "@/components/dialogs/dialog-shell";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  isLoading: boolean;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  isLoading,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Project"
      description={
        project
          ? `Delete "${project.name}"? This action cannot be undone.`
          : undefined
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? "Deleting..." : "Delete Project"}
          </Button>
        </>
      }
    />
  );
}
