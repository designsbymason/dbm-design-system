// Small helpers shared by the `*.snippets.ts` builders that write a Storybook control's free text
// into a "Show code" snippet (`07-storybook-and-documentation-standards.md` §4.2). Docs-only:
// nothing here is part of the published package.

/** Text as JSX children: `& < > { }` written as entities, so the snippet reads back as the same text. */
export const escapeJsxText = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

/**
 * An attribute value as a reader would write it: a plain string, or a `{"…"}` expression when the
 * text holds a quote, an ampersand or a backslash (which a JSX string attribute would misread).
 */
export const quote = (value: string): string => (/["&\\]/.test(value) ? `{${JSON.stringify(value)}}` : `"${value}"`);

/**
 * A `truncate` control's value as the number a reader would write. The control is a text field, so
 * it holds `""` ("not set") or a numeric string as often as a number.
 */
export const truncateValue = (value: unknown): number | undefined => {
  if (typeof value === "number") return value > 0 ? value : undefined;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
};
