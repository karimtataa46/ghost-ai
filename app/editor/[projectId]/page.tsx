import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/current-user";
import { findAccessibleProject } from "@/lib/projects";

// Placeholder workspace: the canvas arrives with the Liveblocks feature. Access is checked
// now so the route never shows a project the user is not an owner or collaborator of.
async function Workspace({ params }: Pick<PageProps<"/editor/[projectId]">, "params">) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  const project = user && (await findAccessibleProject(projectId, user.userId, user.email));

  if (!project) {
    notFound();
  }

  return (
    <div className="bg-grid flex flex-1 items-center justify-center px-4 py-8">
      <div className="flex max-w-xl flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold wrap-anywhere text-copy-primary sm:text-3xl">
          {project.name}
        </h1>
        <p className="text-sm text-copy-muted">
          The canvas for this project is not available yet.
        </p>
      </div>
    </div>
  );
}

export default function WorkspacePage({ params }: PageProps<"/editor/[projectId]">) {
  return (
    <Suspense fallback={null}>
      <Workspace params={params} />
    </Suspense>
  );
}
