"use client";

import { LEGAL_DISCLAIMER } from "@/lib/disclaimer";

export function Footer() {
  return (
    <footer className="no-print mt-12 border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-brand-gray space-y-2">
        <p>
          <span className="font-semibold text-zinc-700">Disclaimer.</span>{" "}
          {LEGAL_DISCLAIMER}
        </p>
        <p>
          © {new Date().getFullYear()} Prelegal · Templates licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline"
          >
            CC BY 4.0
          </a>{" "}
          from{" "}
          <a href="https://commonpaper.com" className="underline">
            Common Paper
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
