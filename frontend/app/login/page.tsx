"use client";

import { AuthForm } from "@/components/AuthForm";
import { api } from "@/lib/api";

export default function LoginPage() {
  return (
    <AuthForm
      mode="login"
      title="Sign in"
      submitLabel="Sign in"
      action={api.login}
      altPrompt="No account?"
      altHref="/signup"
      altLabel="Create one"
    />
  );
}
