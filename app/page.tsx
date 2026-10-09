import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AuthRedirect() {
  const { userId } = await auth();

  return redirect(userId ? "/editor" : "/sign-in");
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AuthRedirect />
    </Suspense>
  );
}
