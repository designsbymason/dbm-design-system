import { useMemo } from "react";
import { diffGutter, parseDiffNumbers } from "./diffNumbers";
import { resolveLanguage } from "./tokenize";
import type { TokenLine } from "./tokenize";

/**
 * How a block's lines are numbered. Ordinarily they count from `startLine`; a `diff` with hunk headers is numbered
 * from them instead, in an old and a new column (`diff`), and one with none, such as a hand-written snippet, has no
 * line numbers to show, so `numbered` is false and it is drawn without a gutter. In a numbered diff `highlightLines`
 * counts the rows from 1, since `startLine` has nothing to say there.
 *
 * @returns `numbered`: whether there is a gutter; `diff`: the two columns' text for each row and their width, when it
 * is a numbered diff; `firstLine`: the number the first row has (what `highlightLines` counts from); `gutterDigits`: the
 * gutter's width in characters.
 */
export function useLineNumbers(showLineNumbers: boolean, startLine: number, language: string | undefined, lines: TokenLine[]) {
  const isDiff = resolveLanguage(language) === "diff";
  const diff = useMemo(() => {
    if (!showLineNumbers || !isDiff) return undefined;
    const numbers = parseDiffNumbers(lines.map((line) => line.map((token) => token.text).join("")));
    return numbers && diffGutter(numbers);
  }, [showLineNumbers, isDiff, lines]);
  const numbered = showLineNumbers && (!isDiff || diff !== undefined);
  const firstLine = diff ? 1 : Number.isFinite(startLine) ? Math.trunc(startLine) : 1;
  const gutterDigits = diff
    ? 2 * diff.digits + 2
    : String(Math.max(Math.abs(firstLine), Math.abs(firstLine + lines.length - 1))).length + (firstLine < 0 ? 1 : 0);
  return { numbered, diff, firstLine, gutterDigits };
}
