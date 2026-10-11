import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

export interface CurrentUser {
  userId: string;
  // Verified primary email, used to match collaborators. Null when it is not verified.
  email: string | null;
}

// Null when signed out. Cached per request so a layout and its page share one Clerk lookup.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress;
  const isVerified = primaryEmail?.verification?.status === "verified";

  return { userId, email: isVerified ? primaryEmail.emailAddress : null };
});
