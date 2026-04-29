"use client";

import Link from "next/link";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Pick a template",
    body: "Twelve Common Paper templates ready to go: NDA, AI Addendum, and more on the way.",
  },
  {
    title: "Chat with the assistant",
    body: "Describe the deal in plain English. The assistant fills in the cover page as you talk.",
  },
  {
    title: "Print or download",
    body: "Save as PDF and send to counsel for review. Your drafts stay in your account.",
  },
];

export function Hero() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand-navy to-[#0a3a78] px-8 py-14 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-yellow">
          Common Paper, common sense
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">
          Draft legal agreements with an AI assistant.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-200">
          Prelegal turns a chat into a polished cover page over the
          industry-standard Common Paper terms. Sign up to start a draft
          and pick it up later.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-navy hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gray">
          How it works
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-3 text-base font-semibold text-brand-navy">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
