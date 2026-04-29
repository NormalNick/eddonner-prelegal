"use client";

import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { TemplatePicker } from "@/components/TemplatePicker";
import { useAuth } from "@/lib/useAuth";

export default function Home() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppHeader user={user} loading={loading} onLogout={logout} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {loading ? (
          <div className="text-sm text-brand-gray">Loading…</div>
        ) : user ? (
          <SignedInHome />
        ) : (
          <Hero />
        )}
      </main>

      <Footer />
    </div>
  );
}

function SignedInHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">
          Start a new draft
        </h1>
        <p className="mt-1 text-sm text-brand-gray">
          Pick a template to begin. The assistant will guide you through
          filling in the cover page.
        </p>
      </div>
      <TemplatePicker />
    </div>
  );
}
