"use client";

import type { FormEvent } from "react";

import { DialogShell } from "@/components/dialogs/dialog-shell";
import { ProjectNameField } from "@/components/dialogs/project-name-field";
import { Button } from "@/components/ui/button";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  slug: string;
  isLoading: boolean;
  onSubmit: () => void;
}

const FORM_ID = "create-project-form";

export function CreateProjectDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  slug,
  isLoading,
  onSubmit,
}: CreateProjectDialogProps) {
  const canSubmit = name.trim() !== "" && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Create Project"
      description="Start a new architecture workspace."
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
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ProjectNameField
          id="create-project-name"
          label="Project name"
          value={name}
          onChange={onNameChange}
          placeholder="Payments Platform"
          disabled={isLoading}
        />
        <p className="flex items-baseline gap-2 text-sm text-copy-muted">
          Slug
          <code className="min-w-0 rounded-xl bg-subtle px-2 py-1 font-mono text-xs break-all text-copy-secondary">
            {slug || "your-project-name"}
          </code>
        </p>
      </form>
    </DialogShell>
  );
}
