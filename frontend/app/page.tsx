"use client";

import { useMemo, useState } from "react";
import { AuthHeader } from "@/components/AuthHeader";
import { NdaForm } from "@/components/NdaForm";
import { NdaPreview } from "@/components/NdaPreview";
import { buildFullNda } from "@/lib/build-nda";
import { createDefaultFormData } from "@/lib/nda-defaults";

export default function Home() {
  const [formData, setFormData] = useState(createDefaultFormData);
  const markdown = useMemo(() => buildFullNda(formData), [formData]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="no-print border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Mutual NDA Creator
            </h1>
            <p className="text-sm text-zinc-500">
              Fill in the form to generate a Common Paper Mutual NDA. Print or save as
              PDF when ready.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AuthHeader />
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
            <h2 className="text-base font-semibold text-zinc-900 mb-4">
              Your information
            </h2>
            <NdaForm data={formData} onChange={setFormData} />
          </section>

          <section className="print-only-document rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
            <NdaPreview markdown={markdown} />
          </section>
        </div>
      </main>
    </div>
  );
}
