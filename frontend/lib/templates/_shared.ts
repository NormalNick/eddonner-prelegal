/**
 * Helpers shared by every per-template cover-page builder. Keep this
 * surface small — anything richer probably belongs in the template
 * folder itself.
 */

export const PLACEHOLDER = "_____";
export const NONE = "_None._";

export function formatEffectiveDate(isoDate: string): string {
  if (!isoDate) return PLACEHOLDER;
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function fieldOrPlaceholder(value: string): string {
  return value.trim() || PLACEHOLDER;
}

export function fieldOrNone(value: string): string {
  return value.trim() || NONE;
}

export function escapeMarkdownBlock(text: string): string {
  return text
    .replace(/`/g, "\\`")
    .split("\n")
    .map((line) => {
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        return line.replace(/^(\s*)/, "$1\\");
      }
      return line.replace(/^(\s*)([#|>])/, "$1\\$2");
    })
    .join("\n");
}
