import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { ProjectsProvider } from "@/components/editor/projects-provider";
import { getCurrentUser } from "@/lib/project-access";
import { listOwnedProjects, listSharedProjects } from "@/lib/projects";

// The sidebar's project lists are fetched here, on the server, and shared through
// `ProjectsProvider`; each page renders its own shell (home or workspace) around them.
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
    <ProjectsProvider ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      {children}
    </ProjectsProvider>
  );
}

export default function EditorLayout({ children }: LayoutProps<"/editor">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-base" />}>
      <EditorWithProjects>{children}</EditorWithProjects>
    </Suspense>
  );
}
