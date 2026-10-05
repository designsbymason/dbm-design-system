import { cx, mergeDefined } from "@dbm-design-system/primitives";
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "../../atoms/Link";
import styles from "./TableOfContents.module.css";
import type {
  TableOfContentsItem,
  TableOfContentsLabels,
  TableOfContentsProps,
  TableOfContentsSize,
  TableOfContentsTone,
} from "./TableOfContents.types";

const sizeClass: Record<TableOfContentsSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const toneClass: Record<TableOfContentsTone, string | undefined> = {
  brand: styles.toneBrand,
  neutral: styles.toneNeutral,
};

const levelClass = [undefined, undefined, styles.level2, styles.level3, styles.level4] as const;

const defaultLabels: TableOfContentsLabels = { title: "On this page", navigation: "Table of contents" };

/** An entry as it is drawn: written by the caller, or read from a heading. */
interface Entry {
  id: string;
  label: TableOfContentsItem["label"];
  level: 1 | 2 | 3 | 4;
}

const clampLevel = (level: number): 1 | 2 | 3 | 4 => Math.min(Math.max(Math.trunc(level) || 1, 1), 4) as 1 | 2 | 3 | 4;

/** The page's own preference, read when it is needed rather than at render, so a server render never touches it. */
const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

/** Reads the entries from the headings `selector` finds under `root`, in document order. */
function scan(root: ParentNode, selector: string): Entry[] {
  let elements: Element[];
  try {
    elements = [...root.querySelectorAll(selector)];
  } catch {
    // An invalid selector finds nothing; the effect's development warning says why.
    return [];
  }
  const ranks = elements.map((element) => {
    const match = /^H([1-6])$/.exec(element.tagName);
    return match ? Number(match[1]) : undefined;
  });
  const top = Math.min(...ranks.filter((rank): rank is number => rank !== undefined), 6);
  const entries: Entry[] = [];
  elements.forEach((element, index) => {
    const rank = ranks[index];
    if (!element.id) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`TableOfContents: a heading with no \`id\` was skipped, since there is nothing to link to: "${element.textContent?.trim()}".`);
      }
      return;
    }
    const level = rank !== undefined ? rank - top + 1 : Number(element.getAttribute("data-toc-level")) || 1;
    entries.push({ id: element.id, label: element.textContent?.trim() ?? "", level: clampLevel(level) });
  });
  return entries;
}

const sameEntries = (a: Entry[], b: Entry[]): boolean =>
  a.length === b.length && a.every((entry, index) => entry.id === b[index]?.id && entry.label === b[index]?.label && entry.level === b[index]?.level);

/**
 * An outline of a page: a list of links to its sections, with the one being read marked as it scrolls.
 *
 * Give it `items`, or leave them out and it reads the `h2` and `h3` headings from the page (or from `contentRef`).
 * The current entry follows the scroll position and is marked `aria-current="location"`; a click scrolls to the
 * section (smoothly, unless the person prefers less motion) and keeps it clear of a sticky header with
 * `scrollOffset`. Wrap it in `Affix` to keep it in view beside long content.
 *
 * @example
 * ```tsx
 * <TableOfContents items={[{ id: "intro", label: "Intro" }, { id: "usage", label: "Usage" }]} />
 * <TableOfContents contentRef={articleRef} />
 * ```
 */
export const TableOfContents = forwardRef<HTMLElement, TableOfContentsProps>(
  (
    {
      items,
      contentRef,
      selector = "h2, h3",
      activeId: controlledActiveId,
      defaultActiveId,
      onActiveIdChange,
      scrollContainerRef,
      scrollOffset = 0,
      smoothScroll = true,
      size = "md",
      tone = "brand",
      highlightActive = false,
      showTitle = true,
      labels,
      className,
      style,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const text = mergeDefined(defaultLabels, labels);
    const titleId = useId();
    const reading = items === undefined;

    // --- The entries ---
    const [scanned, setScanned] = useState<Entry[]>([]);
    useEffect(() => {
      if (!reading) return undefined;
      const root: ParentNode = contentRef?.current ?? document;
      const observed: Node = contentRef?.current ?? document.body;
      if (process.env.NODE_ENV !== "production") {
        try {
          document.createDocumentFragment().querySelector(selector);
        } catch {
          console.warn(`TableOfContents: \`selector\` is not a valid CSS selector: "${selector}".`);
        }
      }
      const read = () => {
        const next = scan(root, selector);
        setScanned((current) => (sameEntries(current, next) ? current : next));
      };
      read();
      // Headings that arrive or change later (a page that loads its content, a client-side route) are picked up.
      let frame = 0;
      const observer = new MutationObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(read);
      });
      observer.observe(observed, { childList: true, subtree: true, characterData: true });
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
      };
    }, [reading, contentRef, selector]);

    const entries: Entry[] = reading
      ? scanned
      : items.map((item) => ({ id: item.id, label: item.label, level: clampLevel(item.level ?? 1) }));

    // --- The current entry ---
    const isControlled = controlledActiveId !== undefined;
    const [internalActiveId, setInternalActiveId] = useState(defaultActiveId);
    const activeId = isControlled ? controlledActiveId : internalActiveId;
    const activeRef = useRef(activeId);
    activeRef.current = activeId;
    const onChangeRef = useRef(onActiveIdChange);
    onChangeRef.current = onActiveIdChange;

    const setActive = useCallback(
      (id: string | undefined) => {
        if (id === activeRef.current) return;
        activeRef.current = id;
        if (!isControlled) setInternalActiveId(id);
        onChangeRef.current?.(id);
      },
      [isControlled],
    );

    // While a click is scrolling to its section the outline holds that section, and catches up once the scroll stops.
    const holdingRef = useRef(false);

    const entryIds = entries.map((entry) => entry.id).join("\n");
    useEffect(() => {
      if (isControlled || entryIds === "") return undefined;
      const ids = entryIds.split("\n");
      const container = scrollContainerRef?.current ?? null;
      const scroller: HTMLElement | Window = container ?? window;

      const measure = (): string | undefined => {
        const limit = (container ? container.getBoundingClientRect().top : 0) + scrollOffset + 1;
        let current: string | undefined;
        let currentTop = -Infinity;
        for (const id of ids) {
          const top = document.getElementById(id)?.getBoundingClientRect().top;
          if (top !== undefined && top <= limit && top > currentTop) {
            current = id;
            currentTop = top;
          }
        }
        // Nothing has reached the top yet (the first heading sits a little below it): the first heading showing
        // in the scrolling area is the one being read. One still below the fold marks nothing.
        if (current === undefined) {
          const bottom = container ? container.getBoundingClientRect().bottom : window.innerHeight;
          let firstTop = Infinity;
          for (const id of ids) {
            const top = document.getElementById(id)?.getBoundingClientRect().top;
            if (top !== undefined && top > limit && top < bottom && top < firstTop) {
              current = id;
              firstTop = top;
            }
          }
        }
        // A short last section can never reach the top; at the very end of the page it is the one being read.
        const area = container ?? document.documentElement;
        const atEnd = area.scrollHeight > area.clientHeight && Math.ceil(area.scrollTop + area.clientHeight) >= area.scrollHeight - 1;
        if (atEnd) {
          const last = [...ids].reverse().find((id) => document.getElementById(id));
          if (last) return last;
        }
        return current;
      };

      let frame = 0;
      let release = 0;
      const update = () => {
        frame = 0;
        // With none of the sections on the page there is nothing to read a position from, so the mark stays as it
        // is — a scroll of the page must not clear the entry of an outline that points elsewhere.
        if (!ids.some((id) => document.getElementById(id))) return;
        if (holdingRef.current) {
          window.clearTimeout(release);
          release = window.setTimeout(() => {
            holdingRef.current = false;
            setActive(measure());
          }, 150);
          return;
        }
        setActive(measure());
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };

      // A given `defaultActiveId` stands until the first scroll; otherwise the outline starts where the page is.
      if (activeRef.current === undefined) {
        const initial = measure();
        if (initial !== undefined) setActive(initial);
      }
      scroller.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      return () => {
        scroller.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        cancelAnimationFrame(frame);
        window.clearTimeout(release);
      };
    }, [entryIds, isControlled, scrollContainerRef, scrollOffset, setActive]);

    // --- Following a link ---
    const follow = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      const behavior: ScrollBehavior = smoothScroll && !prefersReducedMotion() ? "smooth" : "auto";
      const container = scrollContainerRef?.current ?? null;
      const distance = target.getBoundingClientRect().top - (container ? container.getBoundingClientRect().top : 0) - scrollOffset;
      holdingRef.current = true;
      if (container) container.scrollTo({ top: container.scrollTop + distance, behavior });
      else window.scrollTo({ top: window.scrollY + distance, behavior });
      setActive(id);
      try {
        // The address names the section, as a plain link would, without adding a history entry for each click.
        window.history.replaceState(window.history.state, "", `#${id}`);
      } catch {
        // A sandboxed frame may refuse to change its address; the scroll has already happened.
      }
      // A key press (`detail` is 0 for one) moves keyboard focus to the section, so the next Tab continues from there.
      if (event.detail === 0) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    };

    if (entries.length === 0) return null;

    return (
      <nav
        {...props}
        ref={ref}
        // After `...props`, so a caller's own value can't replace what the component works out.
        aria-label={ariaLabel ?? (ariaLabelledBy === undefined && !showTitle ? text.navigation : undefined)}
        aria-labelledby={ariaLabel === undefined ? (ariaLabelledBy ?? (showTitle ? titleId : undefined)) : undefined}
        className={cx(styles.root, sizeClass[size], toneClass[tone], highlightActive && styles.highlighted, className)}
        style={style}
      >
        {showTitle && (
          <p id={titleId} className={styles.title}>
            {text.title}
          </p>
        )}
        {/* The roles are stated outright: Safari with VoiceOver drops list semantics once the markers are removed. */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above. */}
        <ul role="list" className={styles.list}>
          {entries.map((entry) => {
            const isActive = entry.id === activeId;
            return (
              // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
              <li key={entry.id} role="listitem" className={cx(styles.item, levelClass[entry.level], isActive && styles.itemActive)}>
                <Link
                  href={`#${entry.id}`}
                  underline="none"
                  className={cx(styles.link, isActive && styles.active)}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(event) => follow(event, entry.id)}
                >
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  },
);
TableOfContents.displayName = "TableOfContents";
