"use client";

import type { FormEvent } from "react";

import { DialogError } from "@/components/dialogs/dialog-error";
import { DialogShell } from "@/components/dialogs/dialog-shell";
import { ProjectNameField } from "@/components/dialogs/project-name-field";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  name: string;
  onNameChange: (name: string) => void;
  isLoading: boolean;
  error: string | null;
  onSubmit: () => void;
}

const FORM_ID = "rename-project-form";

export function RenameProjectDialog({
  open,
  onOpenChange,
  project,
  name,
  onNameChange,
  isLoading,
  error,
  onSubmit,
}: RenameProjectDialogProps) {
  const canSubmit = name.trim() !== "" && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Rename Project"
      description={project ? `Current name: ${project.name}` : undefined}
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
          <Button type="submit" form={FORM_ID} disabled={!canSubmit}>
            {isLoading ? "Renaming..." : "Rename Project"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ProjectNameField
          id="rename-project-name"
          label="New project name"
          value={name}
          onChange={onNameChange}
          disabled={isLoading}
          autoFocus
        />
        <DialogError message={error} />
      </form>
    </DialogShell>
  );
}
