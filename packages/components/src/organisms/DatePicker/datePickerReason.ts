/** The reason a date can't be chosen, written by the app's `unavailableReason`, or `""` for a date that can. */
export function reasonOf(
  unavailableReason: ((date: string) => string | null | undefined | false) | undefined,
  date: string,
): string {
  const reason = unavailableReason?.(date);
  return typeof reason === "string" ? reason : "";
}
