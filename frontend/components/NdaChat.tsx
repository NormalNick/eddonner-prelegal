"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/api";

interface NdaChatProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onReset: () => void;
}

export function NdaChat({ messages, loading, error, onSend, onReset }: NdaChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    onSend(text);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-zinc-900">Chat with the assistant</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-brand-blue hover:underline disabled:text-brand-gray"
          disabled={loading || messages.length <= 1}
        >
          Start over
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 p-4 space-y-3"
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {loading ? (
          <div className="text-sm text-brand-gray italic">Assistant is thinking…</div>
        ) : null}
        {error ? (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell the assistant about your NDA…"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          className="rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          disabled={loading || input.trim().length === 0}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-lg bg-brand-blue px-3 py-2 text-sm text-white whitespace-pre-wrap"
            : "max-w-[85%] rounded-lg bg-white border border-zinc-200 px-3 py-2 text-sm text-zinc-900 whitespace-pre-wrap"
        }
      >
        {message.content}
      </div>
    </div>
  );
}
