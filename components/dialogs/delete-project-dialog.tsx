"use client";

import { DialogError } from "@/components/dialogs/dialog-error";
import { DialogShell } from "@/components/dialogs/dialog-shell";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  isLoading,
  error,
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
    >
      <DialogError message={error} />
    </DialogShell>
  );
}
