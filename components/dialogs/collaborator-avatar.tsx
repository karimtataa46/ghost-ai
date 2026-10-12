import Image from "next/image";

import type { Collaborator } from "@/types/collaborator";

const SIZE = 32;

// Clerk avatar when there is one, otherwise the first letter of the name or email.
export function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  if (collaborator.imageUrl) {
    // Clerk serves its own optimized avatars, so Next's image optimizer is skipped.
    return (
      <Image
        src={collaborator.imageUrl}
        alt=""
        width={SIZE}
        height={SIZE}
        unoptimized
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  const initial = (collaborator.name ?? collaborator.email).charAt(0).toUpperCase();

  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-medium text-copy-secondary"
    >
      {initial}
    </span>
  );
}
