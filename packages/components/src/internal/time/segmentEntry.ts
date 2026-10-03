import { hourRange } from "./timeValue";
import type { HourCycle, Segment } from "./timeValue";

// Typing digits into one segment. The rule is the one a native time field follows: a first digit
// that could still start a valid two-digit number waits for a second; one that couldn't (a 7 in
// the minutes) is the whole number at once. Pure, so the odd cases can be listed and tested.

export interface DigitResult {
  /** The segment's value now, or `undefined` while a lone digit isn't yet one (a 0 in the 12-hour hour). */
  value: number | undefined;
  /** The first digit typed, kept so the next one can complete the number; `undefined` when entry is done. */
  buffer: number | undefined;
  /** True when this segment is complete and focus should move on. */
  done: boolean;
  /** A digit that didn't fit this segment, to start the next one with (typing "1" then "3" in the 12-hour hour). */
  carry?: number;
}

const bounds = (segment: Segment, cycle: HourCycle) =>
  segment === "hour" ? hourRange(cycle) : { min: 0, max: 59 };

/** The digit `character` stands for in any script, or `undefined` if it isn't a decimal digit. */
export function digitValue(character: string): number | undefined {
  if (character.length === 0 || !/^\p{Nd}$/u.test(character)) return undefined;
  // Decimal digits sit in unbroken runs of ten, starting at a zero: walk down to it.
  let code = character.codePointAt(0)!;
  let offset = 0;
  while (code > 0 && /^\p{Nd}$/u.test(String.fromCodePoint(code - 1)) && offset < 9) {
    code -= 1;
    offset += 1;
  }
  return offset;
}

/**
 * Feeds one digit into a number segment. `buffer` is the first digit typed here so far.
 * (`period` isn't numeric and takes letters instead; see `periodFromLetter`.)
 */
export function enterDigit(
  segment: Exclude<Segment, "period">,
  buffer: number | undefined,
  digit: number,
  cycle: HourCycle,
): DigitResult {
  const { min, max } = bounds(segment, cycle);
  if (buffer === undefined) {
    const firstDigitLimit = Math.floor(max / 10);
    if (digit > firstDigitLimit) {
      // Can't start a two-digit number: it is the number (a 0 can't get here for a 0 minimum).
      return { value: digit >= min ? digit : undefined, buffer: undefined, done: true };
    }
    // Could start one. A lone 0 is a value where 0 is allowed (24-hour, minutes), and not in the 12-hour hour.
    return { value: digit >= min ? digit : undefined, buffer: digit, done: false };
  }
  const combined = buffer * 10 + digit;
  if (combined >= min && combined <= max) return { value: combined, buffer: undefined, done: true };
  if (buffer >= min) return { value: buffer, buffer: undefined, done: true, carry: digit };
  // A 0 waiting in the 12-hour hour and another 0: still nothing valid; keep waiting.
  return { value: undefined, buffer, done: false };
}

/** AM or PM from a typed letter, given the field's own AM and PM labels (first letter, any case). */
export function periodFromLetter(letter: string, labels: { am: string; pm: string }): "am" | "pm" | undefined {
  const typed = letter.toLocaleLowerCase();
  if (typed.length === 0) return undefined;
  const am = labels.am.toLocaleLowerCase();
  const pm = labels.pm.toLocaleLowerCase();
  if (am.startsWith(typed) && !pm.startsWith(typed)) return "am";
  if (pm.startsWith(typed) && !am.startsWith(typed)) return "pm";
  // The plain letters work whatever the labels are, so a field relabelled "a.m." still takes an "a".
  if (typed === "a") return "am";
  if (typed === "p") return "pm";
  return undefined;
}
