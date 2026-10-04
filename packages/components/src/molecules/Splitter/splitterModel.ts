// The arithmetic of a Splitter, with no React in it: pane sizes are percentages of the space the panes share
// (the container less its handles), and every operation takes a layout and returns a new one.

/** One pane's limits, all as percentages of the shared space. */
export interface PaneConstraints {
  min: number;
  max: number;
  collapsible: boolean;
  /** The size the pane has once collapsed (0 for a pane that disappears). */
  collapsed: number;
}

const EPSILON = 1e-6;
/** How close to its collapsed size a pane has to be to count as collapsed. */
const COLLAPSED_TOLERANCE = 0.05;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Whether a pane of this size is collapsed. */
export function isCollapsed(size: number, constraints: PaneConstraints | undefined): boolean {
  return Boolean(constraints?.collapsible) && size <= (constraints?.collapsed ?? 0) + COLLAPSED_TOLERANCE;
}

/**
 * Brings a layout to a valid one: non-negative, summing to 100, and inside every pane's limits. A pane pushed
 * outside its limits gives or takes the difference from the panes that still have room, in proportion to it.
 */
export function normalizeLayout(sizes: number[], constraints: PaneConstraints[]): number[] {
  const count = sizes.length;
  if (count === 0) return [];
  let layout = sizes.map((size) => (Number.isFinite(size) && size > 0 ? size : 0));
  const total = sum(layout);
  layout = total <= EPSILON ? layout.map(() => 100 / count) : layout.map((size) => (size / total) * 100);

  for (let pass = 0; pass < count + 2; pass += 1) {
    let difference = 0;
    layout = layout.map((size, index) => {
      const limits = constraints[index];
      const clamped = limits ? clamp(size, limits.min, limits.max) : size;
      difference += size - clamped;
      return clamped;
    });
    if (Math.abs(difference) < EPSILON) break;
    const room = layout.map((size, index) =>
      difference > 0 ? (constraints[index]?.max ?? 100) - size : size - (constraints[index]?.min ?? 0),
    );
    const totalRoom = sum(room.filter((value) => value > EPSILON));
    if (totalRoom <= EPSILON) break;
    const direction = difference > 0 ? 1 : -1;
    layout = layout.map((size, index) => {
      const share = room[index] ?? 0;
      return share > EPSILON ? size + direction * Math.min(share, (Math.abs(difference) * share) / totalRoom) : size;
    });
  }
  return layout;
}

/**
 * The starting layout: each pane's own default where it has one, the rest sharing what is left equally,
 * brought inside the limits.
 */
export function initialLayout(defaults: Array<number | undefined>, constraints: PaneConstraints[]): number[] {
  const specified = sum(defaults.map((value) => value ?? 0));
  const unspecified = defaults.filter((value) => value === undefined).length;
  const share = unspecified > 0 ? Math.max(100 - specified, 0) / unspecified : 0;
  return normalizeLayout(
    defaults.map((value) => value ?? share),
    constraints,
  );
}

/**
 * Moves the boundary between pane `index` and the one after it so the first is `desired` big, the second giving or
 * taking the difference. A pane that is allowed to collapse snaps shut once pulled past halfway between its
 * minimum and its collapsed size, and snaps back open (to its minimum) once pulled back past that point. A move
 * that no layout can satisfy returns the layout unchanged.
 */
export function resizePair(
  sizes: number[],
  index: number,
  desired: number,
  constraints: PaneConstraints[],
): number[] {
  const first = constraints[index];
  const second = constraints[index + 1];
  const firstSize = sizes[index];
  const secondSize = sizes[index + 1];
  if (!first || !second || firstSize === undefined || secondSize === undefined) return sizes;

  const total = firstSize + secondSize;
  const low = Math.max(first.min, total - second.max);
  const high = Math.min(first.max, total - second.min);

  let next: number;
  if (
    first.collapsible &&
    desired < first.min &&
    desired < first.collapsed + (first.min - first.collapsed) / 2 &&
    total - first.collapsed <= second.max + EPSILON
  ) {
    next = first.collapsed;
  } else if (
    second.collapsible &&
    total - desired < second.min &&
    total - desired < second.collapsed + (second.min - second.collapsed) / 2 &&
    total - second.collapsed <= first.max + EPSILON
  ) {
    next = total - second.collapsed;
  } else {
    if (low > high + EPSILON) return sizes;
    next = clamp(desired, low, Math.max(low, high));
  }

  if (Math.abs(next - firstSize) < EPSILON) return sizes;
  const layout = [...sizes];
  layout[index] = next;
  layout[index + 1] = total - next;
  return layout;
}

/** The smallest and largest the pane before a handle can be right now, for the handle's `aria-valuemin`/`max`. */
export function pairRange(
  sizes: number[],
  index: number,
  constraints: PaneConstraints[],
): { min: number; max: number } {
  const first = constraints[index];
  const second = constraints[index + 1];
  const total = (sizes[index] ?? 0) + (sizes[index + 1] ?? 0);
  if (!first || !second) return { min: 0, max: 100 };
  const lowest = first.collapsible ? first.collapsed : first.min;
  const highest = second.collapsible ? total - second.collapsed : total - second.min;
  return {
    min: Math.max(lowest, total - second.max),
    max: Math.min(first.max, highest),
  };
}

/**
 * Collapses a collapsible pane, or opens it again at `restore` (the size it had) or its minimum. The pane next to
 * it takes or gives the space, as far as its own limits allow. `null` when the pane can't collapse or has no
 * neighbour.
 */
export function togglePane(
  sizes: number[],
  index: number,
  constraints: PaneConstraints[],
  restore: number | undefined,
): number[] | null {
  const pane = constraints[index];
  const neighbourIndex = index + 1 < sizes.length ? index + 1 : index - 1;
  const neighbour = constraints[neighbourIndex];
  const size = sizes[index];
  const neighbourSize = sizes[neighbourIndex];
  if (!pane?.collapsible || !neighbour || size === undefined || neighbourSize === undefined) return null;

  const total = size + neighbourSize;
  let target = isCollapsed(size, pane) ? clamp(restore ?? pane.min, pane.min, pane.max) : pane.collapsed;
  if (total - target > neighbour.max) target = total - neighbour.max;
  if (total - target < neighbour.min) target = total - neighbour.min;
  target = clamp(target, 0, total);
  if (Math.abs(target - size) < EPSILON) return null;

  const layout = [...sizes];
  layout[index] = target;
  layout[neighbourIndex] = total - target;
  return layout;
}

/** Whether two layouts are the same, to within what a person could tell apart. */
export function sameLayout(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => Math.abs(value - (b[index] ?? 0)) < 1e-4);
}

/**
 * The layout after panes were added or removed: a pane that is still there (by key) keeps its size, a new pane
 * takes its own default (or the share nobody has claimed), and the whole is scaled to 100, so what a removed pane
 * freed, or a new one needs, is shared out in proportion rather than every pane starting over.
 */
export function adaptLayout(
  sizes: number[],
  oldKeys: string[],
  newKeys: string[],
  defaults: Array<number | undefined>,
  constraints: PaneConstraints[],
): number[] {
  const carried = newKeys.map((key, index) => {
    const at = oldKeys.indexOf(key);
    return at >= 0 && sizes[at] !== undefined ? sizes[at] : defaults[index];
  });
  // A pane that was collapsed stays collapsed: left to the limits, its size would be lifted to its minimum.
  const held = constraints.map((limits, index) => {
    const size = carried[index];
    return size !== undefined && oldKeys.includes(newKeys[index] ?? "") && isCollapsed(size, limits)
      ? { ...limits, min: limits.collapsed, max: limits.collapsed }
      : limits;
  });
  return initialLayout(carried, held);
}

/**
 * The layout after the container changed size, when some panes are `fixed` (they keep their length): a fixed
 * pane's percentage is rescaled by `ratio` (the space the panes shared before over the space they share now) and
 * the others share out what is left in proportion to what they had. Collapsed panes hold their collapsed size.
 * When the fixed panes alone fill the container, every pane scales proportionally instead.
 */
export function rescaleForContainer(
  sizes: number[],
  constraints: PaneConstraints[],
  fixed: boolean[],
  ratio: number,
): number[] {
  const pinned = sizes.map((size, index) => {
    const limits = constraints[index];
    if (!limits) return undefined;
    if (isCollapsed(size, limits)) return limits.collapsed;
    return fixed[index] ? clamp(size * ratio, limits.min, limits.max) : undefined;
  });
  const pinnedTotal = sum(pinned.map((value) => value ?? 0));
  const flexIndexes = sizes.map((_, index) => index).filter((index) => pinned[index] === undefined);
  if (flexIndexes.length === 0 || pinnedTotal >= 100 - EPSILON) return normalizeLayout(sizes, constraints);

  const remaining = 100 - pinnedTotal;
  const flexOld = sum(flexIndexes.map((index) => sizes[index] ?? 0));
  const next = sizes.map((size, index) => {
    const value = pinned[index];
    if (value !== undefined) return value;
    return flexOld > EPSILON ? (size * remaining) / flexOld : remaining / flexIndexes.length;
  });
  return normalizeLayout(
    next,
    constraints.map((limits, index) => {
      const value = pinned[index];
      return value === undefined ? limits : { ...limits, min: value, max: value };
    }),
  );
}

/**
 * Sets the two panes beside a handle back to the proportions they started in, keeping the space they share, so the
 * other panes don't move. `null` when they are there already, or have no starting size to go back to.
 */
export function resetPair(
  sizes: number[],
  index: number,
  defaults: Array<number | undefined>,
  constraints: PaneConstraints[],
): number[] | null {
  const first = defaults[index];
  const second = defaults[index + 1];
  const firstSize = sizes[index];
  const secondSize = sizes[index + 1];
  if (first === undefined || second === undefined || firstSize === undefined || secondSize === undefined) return null;
  if (first + second <= EPSILON) return null;
  const next = resizePair(sizes, index, ((firstSize + secondSize) * first) / (first + second), constraints);
  return next === sizes ? null : next;
}
