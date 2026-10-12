import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

// Shown for a room that does not exist or that the user is neither owner nor collaborator of.
// The two cases share one message so a room ID's existence is not revealed.
export function AccessDenied() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface text-copy-muted">
          <Lock className="h-8 w-8" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-copy-primary">
            You don&apos;t have access to this project
          </h1>
          <p className="text-sm text-copy-muted">
            It may have been deleted, or it hasn&apos;t been shared with you.
          </p>
        </div>
        <Link href="/editor" className={buttonVariants({ variant: "outline", size: "lg" })}>
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
      </div>
    </div>
  );
}
