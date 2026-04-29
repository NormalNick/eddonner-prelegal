"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Disclaimer } from "@/components/Disclaimer";
import { DocChat } from "@/components/DocChat";
import { DocPreview } from "@/components/DocPreview";
import { Footer } from "@/components/Footer";
import {
  api,
  ApiError,
  type ChatMessage,
  type ChatResponse,
  type DocumentDetail,
} from "@/lib/api";
import {
  getTemplate,
  type SupportedTemplate,
  type TemplateConfig,
  type TemplateFormData,
} from "@/lib/templates/registry";
import { useAuth } from "@/lib/useAuth";

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
  const docId = searchParams.get("doc");
  const template = getTemplate(slug);

  if (!template) return <UnknownSlug slug={slug} />;
  if (!template.supported) return <ComingSoon template={template} />;
  return (
    <SupportedDraftView
      template={template}
      initialDocId={docId ? Number(docId) : null}
    />
  );
}

function SupportedDraftView({
  template,
  initialDocId,
}: {
  template: SupportedTemplate;
  initialDocId: number | null;
}) {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [formData, setFormData] = useState<TemplateFormData>(() =>
    template.createDefaults(),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: template.greeting },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ slug: string; name: string } | null>(null);
  const [docId, setDocId] = useState<number | null>(initialDocId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState<boolean>(initialDocId !== null);

  const markdown = useMemo(
    () => template.buildDocument(formData),
    [template, formData],
  );

  // Reset state and clear ?doc when the template changes.
  useEffect(() => {
    setFormData(template.createDefaults());
    setMessages([{ role: "assistant", content: template.greeting }]);
    setSuggestion(null);
    setChatError(null);
  }, [template]);

  // Load the existing document when ?doc=… is present.
  useEffect(() => {
    if (initialDocId === null) return;
    let cancelled = false;
    setDocLoading(true);
    api.documents
      .get(initialDocId)
      .then((doc: DocumentDetail) => {
        if (cancelled) return;
        if (doc.templateSlug !== template.slug) {
          setLoadError(
            `That document uses a different template. Open it from the My Documents page.`,
          );
          return;
        }
        setFormData(doc.fields as TemplateFormData);
        if (doc.messages.length > 0) setMessages(doc.messages);
        setDocId(doc.id);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError && err.status === 404
            ? "This document was not found."
            : err instanceof Error
              ? err.message
              : "Failed to load the document.";
        setLoadError(message);
      })
      .finally(() => {
        if (!cancelled) setDocLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialDocId, template.slug]);

  // Auto-save after every successful chat turn. POST on first save,
  // PUT thereafter; the URL is updated to ?doc=… so refreshes resume.
  // `inflight` chains saves so a rapid second turn waits for the first
  // POST to resolve a doc id before deciding POST vs PUT.
  const docIdRef = useRef<number | null>(docId);
  docIdRef.current = docId;
  const inflightRef = useRef<Promise<void>>(Promise.resolve());

  const persist = useCallback(
    (nextFields: TemplateFormData, nextMessages: ChatMessage[]): Promise<void> => {
      const next = inflightRef.current.then(async () => {
        const title = template.summarize(nextFields);
        const currentId = docIdRef.current;
        try {
          if (currentId === null) {
            const created = await api.documents.create({
              templateSlug: template.slug,
              title,
              fields: nextFields,
              messages: nextMessages,
            });
            docIdRef.current = created.id;
            setDocId(created.id);
            const params = new URLSearchParams();
            params.set("t", template.slug);
            params.set("doc", String(created.id));
            router.replace(`/draft?${params.toString()}`);
          } else {
            await api.documents.update(currentId, {
              title,
              fields: nextFields,
              messages: nextMessages,
            });
          }
        } catch (err) {
          console.error("Document save failed", err);
        }
      });
      inflightRef.current = next;
      return next;
    },
    [router, template],
  );

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setChatLoading(true);
    setChatError(null);
    setSuggestion(null);
    try {
      const res: ChatResponse = await api.chat(template.slug, nextMessages, formData);
      let updatedFields = formData;
      if (res.mode === "draft" && res.fieldsPatch) {
        updatedFields = template.applyPatch(formData, res.fieldsPatch ?? {});
        setFormData(updatedFields);
      }
      if (res.mode === "suggest" && res.suggestedSlug) {
        const target = getTemplate(res.suggestedSlug);
        if (target) {
          setSuggestion({ slug: target.slug, name: target.displayName });
        }
      }
      const finalMessages: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: res.reply },
      ];
      setMessages(finalMessages);
      void persist(updatedFields, finalMessages);
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
    setDocId(null);
    docIdRef.current = null;
    const params = new URLSearchParams();
    params.set("t", template.slug);
    router.replace(`/draft?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppHeader user={user} loading={authLoading} onLogout={logout} />

      <div className="no-print border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-brand-gray">
              <Link href="/" className="hover:underline">
                ← All templates
              </Link>
              {docId !== null ? (
                <span className="text-zinc-400">·</span>
              ) : null}
              {docId !== null ? (
                <Link href="/documents" className="hover:underline">
                  My documents
                </Link>
              ) : null}
            </div>
            <h1 className="text-lg font-semibold text-brand-navy">
              {template.displayName} Creator
            </h1>
            <p className="text-sm text-brand-gray">
              Chat with the assistant to draft your document. Drafts auto-save to your account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700"
          >
            Download PDF
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="no-print rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            {authLoading ? (
              <div className="text-sm text-brand-gray">Loading…</div>
            ) : !user ? (
              <SignInPrompt />
            ) : docLoading ? (
              <div className="text-sm text-brand-gray">Loading document…</div>
            ) : loadError ? (
              <DocLoadError message={loadError} />
            ) : (
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
            )}
          </section>

          <section className="space-y-3">
            <Disclaimer showInPrint />
            <div className="print-only-document rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
              <DocPreview markdown={markdown} />
            </div>
          </section>
        </div>
      </main>

      <Footer />
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
  const { user, loading, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppHeader user={user} loading={loading} onLogout={logout} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-xl font-semibold text-brand-navy">{title}</h1>
        <p className="mt-3 text-sm text-zinc-700">{body}</p>
        <Link
          href={actionHref}
          className="mt-6 inline-block rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {actionLabel}
        </Link>
      </main>
      <Footer />
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

function DocLoadError({ message }: { message: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-zinc-900">Couldn't load this document</h2>
      <p className="text-sm text-brand-gray">{message}</p>
      <Link href="/documents" className="text-sm text-brand-blue hover:underline">
        ← Back to My documents
      </Link>
    </div>
  );
}
