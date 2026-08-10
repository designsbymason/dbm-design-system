/**
 * Sorts `[name, value]` entries by an explicit name order — entries not
 * listed in `order` keep their original relative order, placed after
 * everything that is listed. Shared by `PropertiesTable` and
 * `PlaygroundControls` so a component's docs page can define one prop
 * reading order and reuse it for both the full Properties table and the
 * compact Playground panel, instead of maintaining two separate lists
 * that can drift apart.
 */
export function sortEntriesByOrder<T>(
  entries: [string, T][],
  order?: string[],
): [string, T][] {
  if (!order) return entries;
  return [...entries].sort(([a], [b]) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    return (
      (aIndex === -1 ? order.length : aIndex) -
      (bIndex === -1 ? order.length : bIndex)
    );
  });
}
