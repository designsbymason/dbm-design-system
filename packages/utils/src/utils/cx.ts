export type ClassValue = string | false | null | undefined;

/**
 * Joins class names, dropping falsy values. Used across every DBM component
 * to merge a component's own CSS Module class(es) with a consumer-supplied
 * `className`.
 *
 * @example
 * ```ts
 * cx(styles.root, isDisabled && styles.disabled, className)
 * ```
 */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
