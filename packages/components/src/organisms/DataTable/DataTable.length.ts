/** A length token such as `2.75rem` in pixels, or `undefined` when it can't be read (a server render). */
export function readLengthToken(name: string): number | undefined {
  if (typeof document === "undefined") return undefined;
  const root = getComputedStyle(document.documentElement);
  const raw = root.getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return undefined;
  if (raw.endsWith("rem")) return value * Number.parseFloat(root.fontSize);
  return raw.endsWith("px") ? value : undefined;
}

/** A column's `minWidth` or `maxWidth` as pixels: a number is pixels, `"12rem"` and `"200px"` are converted, anything else (`"20%"`) can't be dragged against. */
export function lengthToPx(value: string | number | undefined): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return undefined;
  if (value.trim().endsWith("px")) return amount;
  if (value.trim().endsWith("rem")) {
    const root = typeof document === "undefined" ? 16 : Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return amount * root;
  }
  return undefined;
}
