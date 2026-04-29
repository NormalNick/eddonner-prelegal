"use client";

import { useEffect, useState } from "react";
import { AuthHeader } from "@/components/AuthHeader";
import { TemplatePicker } from "@/components/TemplatePicker";
import { api, ApiError, type User } from "@/lib/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) console.error(err);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Prelegal</h1>
            <p className="text-sm text-zinc-500">
              Pick a template to start drafting with the AI assistant.
            </p>
          </div>
          <AuthHeader user={user} loading={authLoading} onLogout={handleLogout} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <TemplatePicker />
      </main>
    </div>
  );
}
