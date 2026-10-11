import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AccessDenied } from "@/components/editor/access-denied";
import { CanvasPlaceholder } from "@/components/editor/canvas-placeholder";
import { EditorShell } from "@/components/editor/editor-shell";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import { findAccessibleProject, getCurrentUser } from "@/lib/project-access";

// A project's workspace. The room ID is the project ID; access is checked on the
// server before anything project-specific renders. The canvas arrives later.
async function Workspace({ params }: Pick<PageProps<"/editor/[roomId]">, "params">) {
  const { roomId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const project = await findAccessibleProject(roomId, user);

  if (!project) {
    return (
      <EditorShell>
        <AccessDenied />
      </EditorShell>
    );
  }

  return (
    <WorkspaceShell project={project}>
      <CanvasPlaceholder />
    </WorkspaceShell>
  );
}

export default function WorkspacePage({ params }: PageProps<"/editor/[roomId]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-base" />}>
      <Workspace params={params} />
    </Suspense>
  );
}
