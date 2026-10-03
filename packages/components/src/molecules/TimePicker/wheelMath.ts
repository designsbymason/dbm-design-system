// The arithmetic behind a picker wheel: pure functions, no React and no DOM, so the wrap-around and the
// nearest-allowed-value rules can be written as tables of input and output.
//
// A wheel that loops is drawn as several copies of its values end to end, scrolled to the middle copy and put back
// there (without a visible jump, the copies being identical) each time it comes to rest. A *global index* is a row's
// position in all the copies; a *value index* is its position in one copy.

const TARGET_ROWS = 200;

/** How many copies of `count` values make a looping wheel long enough to fling through: odd, so one copy is the middle. */
export function copiesFor(count: number): number {
  if (count <= 0) return 1;
  const needed = Math.max(3, Math.ceil(TARGET_ROWS / count));
  return needed % 2 === 0 ? needed + 1 : needed;
}

/** `index` brought into [0, count), however far or negative. */
export function wrapIndex(index: number, count: number): number {
  return ((index % count) + count) % count;
}

/**
 * The value index nearest to `from` that is allowed (`from` itself if it is): by the shorter way round on a looping
 * wheel, by distance on one that isn't. A tie goes forward (to the larger index). `undefined` if nothing is allowed.
 */
export function nearestAllowedIndex(allowed: boolean[], from: number, loops: boolean): number | undefined {
  const count = allowed.length;
  if (count === 0) return undefined;
  for (let distance = 0; distance <= count; distance += 1) {
    for (const direction of [1, -1]) {
      const candidate = from + direction * distance;
      if (loops) {
        const wrapped = wrapIndex(candidate, count);
        if (allowed[wrapped]) return wrapped;
      } else if (candidate >= 0 && candidate < count && allowed[candidate]) {
        return candidate;
      }
    }
  }
  return undefined;
}

/**
 * The next allowed value index from `from` in `direction` (1 or -1), looping at the ends on a looping wheel and stopping
 * there on one that isn't. `undefined` when there is none (the end of a wheel that doesn't loop, or nothing else allowed).
 */
export function stepAllowedIndex(allowed: boolean[], from: number, direction: 1 | -1, loops: boolean): number | undefined {
  const count = allowed.length;
  for (let distance = 1; distance <= count; distance += 1) {
    const candidate = from + direction * distance;
    if (loops) {
      const wrapped = wrapIndex(candidate, count);
      if (wrapped === from) return undefined;
      if (allowed[wrapped]) return wrapped;
    } else if (candidate < 0 || candidate >= count) {
      return undefined;
    } else if (allowed[candidate]) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Of every copy of value `valueIndex`, the global index closest to the row now in the middle — so moving to a value
 * scrolls the short way, not across the whole wheel.
 */
export function nearestGlobalIndex(valueIndex: number, count: number, copies: number, currentGlobal: number): number {
  const copy = Math.round((currentGlobal - valueIndex) / count);
  const clamped = Math.min(copies - 1, Math.max(0, copy));
  return clamped * count + valueIndex;
}

/** The global index of `valueIndex` in the middle copy, where a looping wheel rests. */
export function middleGlobalIndex(valueIndex: number, count: number, copies: number): number {
  return Math.floor(copies / 2) * count + valueIndex;
}
