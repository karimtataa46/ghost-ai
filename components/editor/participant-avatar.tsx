"use client";

import Image from "next/image";
import { useState } from "react";

import { getInitials } from "@/lib/initials";
import type { Participant } from "@/types/presence";

const SIZE = 28;

// 28px (`size-7`), the size of Clerk's `UserButton` avatar (measured: its `$7` size token), so the
// group reads as one row. The ring keeps the avatars readable on the dark canvas and separates
// them where they overlap.
const AVATAR_CLASS =
  "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle text-xs font-medium text-copy-secondary ring-2 ring-surface-border-subtle";

// Display only: the photo when the person has one, otherwise their initials. Named for screen
// readers through `aria-label`, with no hover or click behavior.
export function ParticipantAvatar({ participant }: { participant: Participant }) {
  // A photo that fails to load falls back to the initials instead of leaving an empty circle.
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <span role="img" aria-label={participant.name} className={AVATAR_CLASS}>
      {participant.avatar && !hasImageError ? (
        // Clerk serves its own optimized avatars, so Next's image optimizer is skipped.
        <Image
          src={participant.avatar}
          alt=""
          width={SIZE}
          height={SIZE}
          unoptimized
          onError={() => setHasImageError(true)}
          className="size-full object-cover"
        />
      ) : (
        getInitials(participant.name)
      )}
    </span>
  );
}

// The `+N` that stands in for the participants beyond the visible stack.
export function ParticipantOverflow({ count }: { count: number }) {
  return (
    <span role="img" aria-label={`${count} more`} className={AVATAR_CLASS}>
      +{count}
    </span>
  );
}
