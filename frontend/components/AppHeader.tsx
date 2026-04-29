"use client";

import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import type { User } from "@/lib/api";

interface AppHeaderProps {
  user: User | null;
  loading: boolean;
  onLogout: () => void;
}

/** Shared top-of-page shell: brand wordmark, "My documents" link for
 * signed-in users, and the auth controls. Used across /, /documents,
 * /draft, /login, /signup. */
export function AppHeader({ user, loading, onLogout }: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark />
          <span className="text-lg font-semibold text-brand-navy">Prelegal</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <Link
              href="/documents"
              className="text-brand-blue hover:underline"
            >
              My documents
            </Link>
          ) : null}
          <AuthHeader user={user} loading={loading} onLogout={onLogout} />
        </nav>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-navy text-sm font-bold text-brand-yellow"
    >
      P
    </span>
  );
}
