import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef } from "react";
import styles from "./Highlight.module.css";
import type { HighlightProps, HighlightTone } from "./Highlight.types";

const toneClass: Record<HighlightTone, string | undefined> = {
  warning: styles.toneWarning,
  success: styles.toneSuccess,
  info: styles.toneInfo,
  danger: styles.toneDanger,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface QueryChunk {
  text: string;
  isMatch: boolean;
}

function splitOnQuery(text: string, query: string | string[], caseSensitive: boolean): QueryChunk[] {
  const queries = (Array.isArray(query) ? query : [query]).filter((q) => q.length > 0);
  if (queries.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Longest-first: an alternation tries each branch in order, so without
  // this a shorter query listed before a longer one that contains it (e.g.
  // ["design", "designer"]) would match the shorter substring first and
  // fragment the longer word instead of matching it whole.
  const sortedQueries = queries.slice().sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sortedQueries.map(escapeRegExp).join("|")})`, caseSensitive ? "g" : "gi");
  return text
    .split(pattern)
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => ({
      text: chunk,
      isMatch: queries.some((q) => (caseSensitive ? chunk === q : chunk.toLowerCase() === q.toLowerCase())),
    }));
}

/**
 * An inline highlight for emphasizing a substring — search-match
 * highlighting, "new" markers, etc. Renders one or more native `<mark>`
 * elements (semantically "content of special relevance"), styled with a
 * token-driven background/text pairing rather than the browser's default
 * yellow.
 *
 * Two usage modes: pass `children` alone to highlight the whole of it — the
 * caller pre-wraps the matched substring itself (e.g. a search-result
 * snippet already split around the matched term) — or pass `query`
 * alongside a plain-string `children` to have Highlight itself find and
 * wrap every case-insensitive match of the given substring(s).
 *
 * `ref` forwards to the single rendered `<mark>` when there is exactly one
 * (no `query`, or a `query` matching exactly once) — with zero or multiple
 * matches there's no single element to forward it to, so it's left
 * unattached rather than pointed at an arbitrary one of several.
 *
 * @example
 * ```tsx
 * <Text>Results for <Highlight>{query}</Highlight></Text>
 * <Highlight tone="danger">Deprecated</Highlight>
 * <Highlight query="design">Results for design system</Highlight>
 * <Highlight query={["design", "system"]}>A design system for agents</Highlight>
 * ```
 */
export const Highlight = forwardRef<HTMLElement, HighlightProps>(
  ({ tone = "warning", query, caseSensitive = false, className, style, children, ...props }, ref) => {
    const toneClassName = toneClass[tone];
    const hasWarnedNonStringChildrenRef = useRef(false);

    if (query != null) {
      if (typeof children !== "string") {
        if (process.env.NODE_ENV !== "production" && !hasWarnedNonStringChildrenRef.current) {
          hasWarnedNonStringChildrenRef.current = true;
          console.warn(
            "Highlight: `query` requires `children` to be a plain string — received a non-string value, so `query` was ignored and the whole of `children` is rendered as one highlighted <mark>.",
          );
        }
      } else {
        const chunks = splitOnQuery(children, query, caseSensitive);
        const matchCount = chunks.filter((chunk) => chunk.isMatch).length;

        return (
          <>
            {chunks.map((chunk, index) =>
              chunk.isMatch ? (
                <mark
                  key={index}
                  ref={matchCount === 1 ? ref : undefined}
                  className={cx(styles.root, toneClassName, className)}
                  style={style}
                  {...props}
                >
                  {chunk.text}
                </mark>
              ) : (
                chunk.text
              ),
            )}
          </>
        );
      }
    }

    return (
      <mark ref={ref} className={cx(styles.root, toneClassName, className)} style={style} {...props}>
        {children}
      </mark>
    );
  },
);

Highlight.displayName = "Highlight";
