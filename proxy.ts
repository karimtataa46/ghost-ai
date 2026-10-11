import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { unauthorizedResponse } from "@/lib/api-response";

// The only supported values are the app's own auth routes, `/sign-in` and
// `/sign-up` (`app/sign-in/[[...sign-in]]`, `app/sign-up/[[...sign-up]]`).
// Any other value would make a path public that renders no auth form, so the
// env vars must match those routes; they fall back to them when unset or empty.
const publicPaths = [
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up",
];

const isPublicRoute = createRouteMatcher(publicPaths.map((path) => `${path}(.*)`));
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  // `auth.protect()` redirects page-like requests and answers 404 to everything
  // else, so API clients get an explicit 401 instead. Handlers re-check the user.
  if (isApiRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedResponse();
    }

    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
