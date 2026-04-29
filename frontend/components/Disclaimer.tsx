import { LEGAL_DISCLAIMER } from "@/lib/disclaimer";

interface DisclaimerProps {
  /** When true, the banner also renders in print output (for the PDF). */
  showInPrint?: boolean;
}

export function Disclaimer({ showInPrint = false }: DisclaimerProps) {
  const className = [
    "rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-zinc-800",
    showInPrint ? "" : "no-print",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className} role="note">
      <span className="font-semibold">Draft only.</span> {LEGAL_DISCLAIMER}
    </div>
  );
}
