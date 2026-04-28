"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthHeader } from "@/components/AuthHeader";
import { NdaChat } from "@/components/NdaChat";
import { NdaPreview } from "@/components/NdaPreview";
import { buildFullNda } from "@/lib/build-nda";
import { createDefaultFormData } from "@/lib/nda-defaults";
import { api, ApiError, type ChatMessage, type NdaFieldsPatch, type User } from "@/lib/api";
import type { NdaFormData, NdaParty } from "@/lib/nda-types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you draft a Mutual NDA. To start, what's the purpose of the agreement — what are the two parties planning to share or evaluate?",
};

function applyPatch(current: NdaFormData, patch: NdaFieldsPatch): NdaFormData {
  const next: NdaFormData = { ...current, party1: { ...current.party1 }, party2: { ...current.party2 } };
  for (const [key, value] of Object.entries(patch) as [keyof NdaFieldsPatch, unknown][]) {
    if (value === null || value === undefined) continue;
    if (key === "party1" || key === "party2") {
      next[key] = applyPartyPatch(current[key], value as Partial<NdaParty>);
    } else {
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

function applyPartyPatch(current: NdaParty, patch: Partial<NdaParty>): NdaParty {
  const next: NdaParty = { ...current };
  for (const [key, value] of Object.entries(patch) as [keyof NdaParty, unknown][]) {
    if (value === null || value === undefined) continue;
    next[key] = String(value);
  }
  return next;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState<NdaFormData>(createDefaultFormData);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const markdown = useMemo(() => buildFullNda(formData), [formData]);

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

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await api.chat(nextMessages, formData);
      setFormData((prev) => applyPatch(prev, res.fieldsPatch));
      setMessages([...nextMessages, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setChatError(message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([GREETING]);
    setFormData(createDefaultFormData());
    setChatError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="no-print border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Mutual NDA Creator</h1>
            <p className="text-sm text-zinc-500">
              Chat with the assistant to draft your NDA. Print or save as PDF when ready.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AuthHeader user={user} loading={authLoading} onLogout={handleLogout} />
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700"
            >
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="no-print rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            {authLoading ? (
              <div className="text-sm text-brand-gray">Loading…</div>
            ) : user ? (
              <NdaChat
                messages={messages}
                loading={chatLoading}
                error={chatError}
                onSend={handleSend}
                onReset={handleReset}
              />
            ) : (
              <SignInPrompt />
            )}
          </section>

          <section className="print-only-document rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
            <NdaPreview markdown={markdown} />
          </section>
        </div>
      </main>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-zinc-900">Sign in to start drafting</h2>
      <p className="text-sm text-brand-gray">
        The AI assistant is available to signed-in users. Create an account or log in to begin.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-brand-purple px-3 py-2 text-sm text-white hover:opacity-90"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
