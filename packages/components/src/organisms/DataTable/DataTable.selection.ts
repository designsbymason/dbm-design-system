/**
 * The ids a header checkbox covers: every selectable row it was given. Its state is `true` when all of them are
 * chosen, `"indeterminate"` when some are, and `false` when none are. With nothing selectable it is `false`.
 */
export function headerState(selected: ReadonlySet<string>, selectableIds: readonly string[]): boolean | "indeterminate" {
  if (selectableIds.length === 0) return false;
  const count = selectableIds.reduce((total, id) => total + (selected.has(id) ? 1 : 0), 0);
  if (count === 0) return false;
  return count === selectableIds.length ? true : "indeterminate";
}

/** `selection` with `ids` chosen or not, in the order they were first chosen. */
export function setChosen(selection: readonly string[], ids: readonly string[], chosen: boolean): string[] {
  if (chosen) {
    const have = new Set(selection);
    return [...selection, ...ids.filter((id) => !have.has(id))];
  }
  const drop = new Set(ids);
  return selection.filter((id) => !drop.has(id));
}

/**
 * The ids from `from` to `to` inclusive within `ordered` (either way round), for a shift-click range. An index that
 * isn't there gives just the one that is, or nothing.
 */
export function idsBetween(ordered: readonly string[], from: string, to: string): string[] {
  const start = ordered.indexOf(from);
  const end = ordered.indexOf(to);
  if (start < 0 || end < 0) return end >= 0 ? [to] : [];
  return ordered.slice(Math.min(start, end), Math.max(start, end) + 1);
}
