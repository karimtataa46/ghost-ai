"use client";

import { Plus } from "lucide-react";

import { useProjects } from "@/components/editor/projects-provider";
import { Button } from "@/components/ui/button";

export function EditorHome() {
  const { openCreate } = useProjects();

  return (
    <div className="flex max-w-xl flex-col items-center gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-copy-primary sm:text-3xl">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-muted">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
      </div>
      <Button size="lg" onClick={openCreate}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}
