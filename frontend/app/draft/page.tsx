"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthHeader } from "@/components/AuthHeader";
import { DocChat } from "@/components/DocChat";
import { DocPreview } from "@/components/DocPreview";
import {
  api,
  ApiError,
  type ChatMessage,
  type ChatResponse,
  type User,
} from "@/lib/api";
import {
  getTemplate,
  type SupportedTemplate,
  type TemplateConfig,
  type TemplateFormData,
} from "@/lib/templates/registry";

export default function DraftPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-sm text-brand-gray">
          Loading…
        </div>
      }
    >
      <DraftPageInner />
    </Suspense>
  );
}

function DraftPageInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("t") ?? "";
  const template = getTemplate(slug);

  if (!template) {
    return <UnknownSlug slug={slug} />;
  }
  if (!template.supported) {
    return <ComingSoon template={template} />;
  }
  return <SupportedDraftView template={template} />;
}

function SupportedDraftView({ template }: { template: SupportedTemplate }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [formData, setFormData] = useState<TemplateFormData>(() =>
    template.createDefaults(),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: template.greeting },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{
    slug: string;
    name: string;
  } | null>(null);

  const markdown = useMemo(
    () => template.buildDocument(formData),
    [template, formData],
  );

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) console.error(err);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // Reset state when the template changes (e.g. user navigates between
  // /draft?t=mutual-nda and /draft?t=ai-addendum without a full reload).
  useEffect(() => {
    setFormData(template.createDefaults());
    setMessages([{ role: "assistant", content: template.greeting }]);
    setSuggestion(null);
    setChatError(null);
  }, [template]);

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
    setSuggestion(null);
    try {
      const res: ChatResponse = await api.chat(template.slug, nextMessages, formData);
      if (res.mode === "draft" && res.fieldsPatch) {
        setFormData((prev) => template.applyPatch(prev, res.fieldsPatch ?? {}));
      }
      if (res.mode === "suggest" && res.suggestedSlug) {
        const target = getTemplate(res.suggestedSlug);
        if (target) {
          setSuggestion({ slug: target.slug, name: target.displayName });
        }
      }
      setMessages([...nextMessages, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setChatError(message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([{ role: "assistant", content: template.greeting }]);
    setFormData(template.createDefaults());
    setChatError(null);
    setSuggestion(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="no-print border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-brand-gray">
              <Link href="/" className="hover:underline">
                ← All templates
              </Link>
            </div>
            <h1 className="text-lg font-semibold text-zinc-900">
              {template.displayName} Creator
            </h1>
            <p className="text-sm text-zinc-500">
              Chat with the assistant to draft your document. Print or save as PDF when ready.
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
              <>
                <DocChat
                  messages={messages}
                  loading={chatLoading}
                  error={chatError}
                  inputPlaceholder={template.inputPlaceholder}
                  onSend={handleSend}
                  onReset={handleReset}
                />
                {suggestion ? (
                  <div className="mt-3 rounded-md bg-yellow-50 px-3 py-2 text-sm text-zinc-800">
                    Try the{" "}
                    <Link
                      href={`/draft?t=${suggestion.slug}`}
                      className="font-medium text-brand-blue hover:underline"
                    >
                      {suggestion.name}
                    </Link>{" "}
                    instead.
                  </div>
                ) : null}
              </>
            ) : (
              <SignInPrompt />
            )}
          </section>

          <section className="print-only-document rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
            <DocPreview markdown={markdown} />
          </section>
        </div>
      </main>
    </div>
  );
}

function ComingSoon({ template }: { template: TemplateConfig }) {
  return (
    <NoticePage
      title={`${template.displayName} — coming soon`}
      body="AI drafting for this template isn't available yet. The Mutual NDA is the closest template we currently support."
      actionHref="/draft?t=mutual-nda"
      actionLabel="Start a Mutual NDA"
    />
  );
}

function UnknownSlug({ slug }: { slug: string }) {
  return (
    <NoticePage
      title="Unknown template"
      body={
        slug
          ? `We don't recognize the template "${slug}".`
          : "No template selected."
      }
      actionHref="/"
      actionLabel="Browse templates"
    />
  );
}

function NoticePage({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/" className="text-sm text-brand-blue hover:underline">
            ← All templates
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-xl font-semibold text-brand-navy">{title}</h1>
        <p className="mt-3 text-sm text-zinc-700">{body}</p>
        <Link
          href={actionHref}
          className="mt-6 inline-block rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {actionLabel}
        </Link>
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
