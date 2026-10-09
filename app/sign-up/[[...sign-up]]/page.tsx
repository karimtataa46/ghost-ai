import { SignUp } from "@clerk/nextjs";

import { AuthLayout } from "@/components/auth/auth-layout";
import { authFormAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp appearance={authFormAppearance} />
    </AuthLayout>
  );
}
