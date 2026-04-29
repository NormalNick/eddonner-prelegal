"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { api, ApiError, type DocumentSummary } from "@/lib/api";
import { getTemplate } from "@/lib/templates/registry";
import { useAuth } from "@/lib/useAuth";

export default function DocumentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [docs, setDocs] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setDocs([]);
      return;
    }
    api.documents
      .list()
      .then(setDocs)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load documents.";
        setError(message);
      });
  }, [authLoading, user]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this draft? This can't be undone.")) return;
    const previous = docs;
    setDocs((current) => current?.filter((d) => d.id !== id) ?? null);
    try {
      await api.documents.remove(id);
    } catch (err) {
      setDocs(previous ?? null);
      const message =
        err instanceof ApiError ? err.message : "Failed to delete the document.";
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppHeader user={user} loading={authLoading} onLogout={logout} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-brand-navy">My documents</h1>
            <p className="mt-1 text-sm text-brand-gray">
              Drafts you've created. Open one to keep editing or delete it when you're done.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            New draft
          </Link>
        </div>

        <div className="mt-6">
          {authLoading ? (
            <p className="text-sm text-brand-gray">Loading…</p>
          ) : !user ? (
            <SignInPrompt />
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : docs === null ? (
            <p className="text-sm text-brand-gray">Loading documents…</p>
          ) : docs.length === 0 ? (
            <EmptyState />
          ) : (
            <DocumentTable docs={docs} onDelete={handleDelete} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DocumentTable({
  docs,
  onDelete,
}: {
  docs: DocumentSummary[];
  onDelete: (id: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-brand-gray">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Template</th>
            <th className="px-4 py-3">Last updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {docs.map((doc) => {
            const tpl = getTemplate(doc.templateSlug);
            const templateName = tpl?.displayName ?? doc.templateSlug;
            return (
              <tr key={doc.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/draft?t=${doc.templateSlug}&doc=${doc.id}`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    {doc.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-700">{templateName}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {formatTimestamp(doc.updatedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(doc.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
      <h2 className="text-base font-semibold text-brand-navy">
        No drafts yet
      </h2>
      <p className="mt-2 text-sm text-brand-gray">
        Pick a template from the home page to start your first draft. We'll
        save it here automatically as you chat.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Browse templates
      </Link>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
      <h2 className="text-base font-semibold text-brand-navy">
        Sign in to see your drafts
      </h2>
      <p className="mt-2 text-sm text-brand-gray">
        Drafts are tied to your account so you can come back to them later.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

function formatTimestamp(raw: string): string {
  // SQLite returns "YYYY-MM-DD HH:MM:SS" in UTC. Treat as UTC, render local.
  const isoish = raw.includes("T") ? raw : raw.replace(" ", "T") + "Z";
  const date = new Date(isoish);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
