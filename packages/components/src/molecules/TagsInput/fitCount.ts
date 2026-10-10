/**
 * How many chips of a row fit on one line beside a "+N more" button, for `TagsInput`'s `overflow="collapse"`.
 * Pure arithmetic on measured widths, so it can be tested without a browser.
 *
 * @param widths the natural width of each chip, in order
 * @param moreWidth the width of the "+N more" button at its widest (every tag hidden)
 * @param available the width the row may fill
 * @param gap the space between neighbours
 * @returns the largest count whose chips, gaps and (when some are left out) the button fit; all of them when
 * they fit without the button. None when not even one fits beside the button but the button alone fits (the
 * count says more than a chip cut to nothing would); one, cut with an ellipsis, when the button does not fit
 * either. A single chip wider than the row, alone, counts as fitting.
 */
export function fitCount(widths: number[], moreWidth: number, available: number, gap: number): number {
  const total = widths.length;
  const limit = Math.max(0, available);
  let used = 0;
  // All of them, no button.
  for (const width of widths) used += Math.min(width, limit);
  used += gap * Math.max(0, total - 1);
  if (used <= limit) return total;

  let best = 0;
  used = 0;
  for (let count = 1; count < total; count += 1) {
    used += Math.min(widths[count - 1] as number, limit);
    const row = used + gap * (count - 1) + gap + moreWidth;
    if (row <= limit) best = count;
  }
  if (best > 0) return best;
  // Not even one fits beside the button: the count alone, unless the button doesn't fit either.
  return total > 0 && moreWidth > limit ? 1 : 0;
}
