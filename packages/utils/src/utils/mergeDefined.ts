/**
 * Lays an object of overrides over an object of defaults, key by key, skipping any override that is
 * `undefined`. Used for a `labels` prop: `{ ...defaults, ...overrides }` lets `{ label: undefined }` replace the
 * default with `undefined`, and a consumer's `labels={{ label: t?.label }}` does exactly that whenever a
 * translation is missing — a blank accessible name, or a crash where the label is a function.
 *
 * @example
 * ```ts
 * const labels = mergeDefined(defaultLabels, labelOverrides);
 * ```
 */
export function mergeDefined<T extends object>(defaults: T, overrides?: Partial<T>): T {
  const merged = { ...defaults };
  if (!overrides) return merged;
  for (const key of Object.keys(overrides) as Array<keyof T>) {
    const value = overrides[key];
    if (value !== undefined) merged[key] = value as T[keyof T];
  }
  return merged;
}
