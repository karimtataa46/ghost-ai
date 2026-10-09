import { SignIn } from "@clerk/nextjs";

import { AuthLayout } from "@/components/auth/auth-layout";
import { authFormAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn appearance={authFormAppearance} />
    </AuthLayout>
  );
}
