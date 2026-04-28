"use client";

import { AuthForm } from "@/components/AuthForm";
import { api } from "@/lib/api";

export default function SignupPage() {
  return (
    <AuthForm
      mode="signup"
      title="Create your account"
      submitLabel="Sign up"
      action={api.signup}
      altPrompt="Already have an account?"
      altHref="/login"
      altLabel="Sign in"
    />
  );
}
