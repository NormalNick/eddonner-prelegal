"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { ApiError, type User } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

interface AuthFormProps {
  mode: "login" | "signup";
  title: string;
  submitLabel: string;
  action: (email: string, password: string) => Promise<User>;
  altPrompt: string;
  altHref: string;
  altLabel: string;
}

export function AuthForm({
  mode,
  title,
  submitLabel,
  action,
  altPrompt,
  altHref,
  altLabel,
}: AuthFormProps) {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await action(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppHeader user={user} loading={authLoading} onLogout={logout} />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-brand-navy">{title}</h1>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label
                className="block text-sm font-medium text-brand-gray mb-1"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-brand-gray mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "…" : submitLabel}
            </button>
          </form>
          <p className="mt-6 text-sm text-brand-gray">
            {altPrompt}{" "}
            <Link href={altHref} className="text-brand-blue hover:underline">
              {altLabel}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
