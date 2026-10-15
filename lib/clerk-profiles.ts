import { clerkClient, type User } from "@clerk/nextjs/server";

export interface ClerkProfile {
  name: string | null;
  imageUrl: string | null;
}

// Display name (first + last name, else username) and avatar of a Clerk user. The avatar is
// only used when the user uploaded one, not Clerk's generated default.
export function toClerkProfile(
  user: Pick<User, "firstName" | "lastName" | "username" | "hasImage" | "imageUrl">
): ClerkProfile {
  return {
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null,
    imageUrl: user.hasImage ? user.imageUrl : null,
  };
}

// Clerk accepts up to 100 email addresses per `getUserList` call.
const EMAIL_FILTER_LIMIT = 100;
const PAGE_LIMIT = 500;

// Looks up display names and avatars for emails through the Clerk Backend API; there is no
// local user table. Keys are lowercased emails. An email with no Clerk user is simply absent,
// and a Clerk failure yields an empty map, so callers fall back to showing the email.
export async function getClerkProfiles(emails: string[]): Promise<Map<string, ClerkProfile>> {
  const profiles = new Map<string, ClerkProfile>();
  const wanted = new Set(emails.map((email) => email.toLowerCase()));

  if (wanted.size === 0) {
    return profiles;
  }

  try {
    const client = await clerkClient();
    const lookups = [...wanted];

    for (let start = 0; start < lookups.length; start += EMAIL_FILTER_LIMIT) {
      // Clerk matches `emailAddress` as a partial, case-insensitive string, so the
      // results can include near misses (`bob@x.com` also finds `rbob@x.com`). Each
      // result is therefore matched exactly against the requested emails below.
      const { data: users } = await client.users.getUserList({
        emailAddress: lookups.slice(start, start + EMAIL_FILTER_LIMIT),
        limit: PAGE_LIMIT,
      });

      for (const user of users) {
        const profile = toClerkProfile(user);

        for (const address of user.emailAddresses) {
          const email = address.emailAddress.toLowerCase();

          // Only verified addresses count, so an unverified claim on someone else's email
          // cannot attach a name or avatar to it.
          if (wanted.has(email) && address.verification?.status === "verified") {
            profiles.set(email, profile);
          }
        }
      }
    }
  } catch (error) {
    console.error("Could not load collaborator profiles from Clerk", error);
    return new Map();
  }

  return profiles;
}
