"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError, type User } from "@/lib/api";

export function AuthHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  if (loading) {
    return <div className="text-sm text-brand-gray">…</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-brand-gray">Hi {user.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-zinc-300 px-3 py-1 text-zinc-700 hover:bg-zinc-50"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/login" className="text-brand-blue hover:underline">
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-md bg-brand-purple px-3 py-1 text-white hover:opacity-90"
      >
        Sign up
      </Link>
    </div>
  );
}
