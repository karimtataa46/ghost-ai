import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { EditorShell } from "@/components/editor/editor-shell";
import { getCurrentUser } from "@/lib/current-user";
import { listOwnedProjects, listSharedProjects } from "@/lib/projects";

// The sidebar lives in this layout, so its project lists are fetched here, on the server.
// A navigation does not re-render a layout; `router.refresh()` after a mutation does.
async function EditorWithProjects({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    listOwnedProjects(user.userId),
    user.email ? listSharedProjects(user.userId, user.email) : [],
  ]);

  return (
    <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      {children}
    </EditorShell>
  );
}

export default function EditorLayout({ children }: LayoutProps<"/editor">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-base" />}>
      <EditorWithProjects>{children}</EditorWithProjects>
    </Suspense>
  );
}
