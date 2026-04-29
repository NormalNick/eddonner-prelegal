"use client";

import Link from "next/link";
import { TEMPLATES, type TemplateConfig } from "@/lib/templates/registry";

export function TemplatePicker() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {TEMPLATES.map((t) => (
        <TemplateCard key={t.slug} template={t} />
      ))}
    </div>
  );
}

function TemplateCard({ template }: { template: TemplateConfig }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-brand-navy">
          {template.displayName}
        </h3>
        {template.supported ? null : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-brand-gray">
            Coming soon
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-zinc-600">{template.description}</p>
    </>
  );

  if (template.supported) {
    return (
      <Link
        href={`/draft?t=${template.slug}`}
        className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-blue hover:shadow-md"
      >
        {inner}
      </Link>
    );
  }

  return (
    <Link
      href={`/draft?t=${template.slug}`}
      className="block rounded-lg border border-dashed border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-blue"
      aria-label={`${template.displayName} (coming soon — opens suggestion)`}
    >
      {inner}
    </Link>
  );
}
