import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import styles from "./Splitter.module.css";
import {
  type PaneConstraints,
  adaptLayout,
  initialLayout,
  isCollapsed,
  normalizeLayout,
  pairRange,
  rescaleForContainer,
  resetPair,
  resizePair,
  sameLayout,
  togglePane,
} from "./splitterModel";
import type {
  SplitterLabels,
  SplitterOrientation,
  SplitterPaneProps,
  SplitterProps,
  SplitterSize,
} from "./Splitter.types";

interface PaneContextValue {
  id: string;
  size: number;
  collapsed: boolean;
  hidden: boolean;
}

const PaneContext = createContext<PaneContextValue | null>(null);

/**
 * A pane size limit as a percentage. A length (`px`, or `rem` against the root font size) can't be turned into
 * one until the container has been measured, so until then it is `unmeasured`.
 */
function resolveSize(
  size: SplitterSize | undefined,
  fallback: number,
  available: number,
  unmeasured: number,
  rootFontSize: number,
): number {
  if (size === undefined) return fallback;
  if (typeof size === "number") return size;
  const value = Number.parseFloat(size);
  if (!Number.isFinite(value)) return fallback;
  if (size.endsWith("%")) return value;
  const pixels = size.endsWith("rem") ? value * rootFontSize : value;
  return available > 0 ? (pixels / available) * 100 : unmeasured;
}

function paneConstraints(
  panes: ReactElement<SplitterPaneProps>[],
  available: number,
  rootFontSize: number,
): PaneConstraints[] {
  return panes.map(({ props }) => {
    const min = resolveSize(props.minSize, 10, available, 0, rootFontSize);
    const max = Math.max(min, resolveSize(props.maxSize, 100, available, 100, rootFontSize));
    const collapsible = Boolean(props.collapsible);
    const collapsed = collapsible ? Math.min(resolveSize(props.collapsedSize, 0, available, 0, rootFontSize), min) : 0;
    return { min, max, collapsible, collapsed };
  });
}

/** The page's root font size in pixels — what a `rem` limit is measured against. */
function readRootFontSize(): number {
  if (typeof document === "undefined") return 16;
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/** The layout a splitter starts from: its panes' own sizes, with any `defaultCollapsed` pane already shut. */
function startingLayout(panes: ReactElement<SplitterPaneProps>[], constraints: PaneConstraints[]): number[] {
  let layout = initialLayout(
    panes.map(({ props }) => props.defaultSize),
    constraints,
  );
  panes.forEach(({ props }, index) => {
    if (!props.defaultCollapsed || props.collapsed !== undefined) return;
    layout = togglePane(layout, index, constraints, undefined) ?? layout;
  });
  return layout;
}

/**
 * One pane of a `Splitter`: a box whose size the splitter manages, holding whatever you put in it. It takes its
 * size limits and collapse behaviour as props; the splitter reads them from the element.
 *
 * @example
 * ```tsx
 * <Splitter.Pane defaultSize={25} minSize="12rem" collapsible>Sidebar</Splitter.Pane>
 * ```
 */
const SplitterPane = forwardRef<HTMLDivElement, SplitterPaneProps>(
  (
    {
      // The splitter reads these off the element; they are not DOM attributes.
      defaultSize: _defaultSize,
      minSize: _minSize,
      maxSize: _maxSize,
      collapsible: _collapsible,
      collapsedSize: _collapsedSize,
      label: _label,
      resizable: _resizable,
      fixed: _fixed,
      collapsed: _collapsed,
      defaultCollapsed: _defaultCollapsed,
      onCollapsedChange: _onCollapsedChange,
      id,
      children,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const context = useContext(PaneContext);

    const hasWarnedRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (!context && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        console.warn(
          "Splitter.Pane: rendered outside a `Splitter` (or not as its direct child), so it has no size to take and no handle beside it. Put it directly inside `Splitter`.",
        );
      }
    }

    return (
      // `{...props}` first, so the computed id, class, data attributes and size can't be replaced by a
      // same-named prop (05-component-api-conventions.md §3).
      <div
        {...props}
        ref={ref}
        id={context?.id ?? id}
        className={cx(styles.pane, context?.collapsed && styles.collapsed, context?.hidden && styles.hidden, className)}
        data-collapsed={context?.collapsed ? "" : undefined}
        style={{ ["--splitter-pane-size" as string]: context?.size ?? 1, ...style } as CSSProperties}
      >
        {typeof children === "function"
          ? children({ collapsed: context?.collapsed ?? false, size: context?.size ?? 100 })
          : children}
      </div>
    );
  },
);
SplitterPane.displayName = "Splitter.Pane";

const isPane = (child: unknown): child is ReactElement<SplitterPaneProps> =>
  isValidElement(child) && child.type === SplitterPane;

const defaultLabels = (formatNumber: (value: number) => string): SplitterLabels => ({
  handle: (position, total, paneLabel) =>
    paneLabel
      ? `Resize ${paneLabel}`
      : total > 1
        ? `Resize panels ${formatNumber(position)} of ${formatNumber(total)}`
        : "Resize panels",
  valueText: (percent) => `${formatNumber(percent)}%`,
  collapsed: "Collapsed",
});

/**
 * A row or column of panes divided by draggable handles, for dashboards and editors: pull a handle (or use the
 * arrow keys on it) to give one pane space from its neighbour. Each handle is a focusable `role="separator"`
 * that reports the size of the pane before it, and a pane can be allowed to collapse. It holds no content of
 * its own and keeps no storage: read the layout with `onLayoutChange` / `onLayoutCommit`, hold it yourself with
 * `layout`.
 *
 * Double clicking a handle, or pressing Enter on it, collapses or opens a collapsible pane beside it, or else sets
 * the two panes beside it back to the proportions they started in (the others don't move).
 *
 * Pane sizes are percentages of the space the panes share (the container less its handles), so a layout keeps
 * its proportions when the container is resized. The splitter fills its parent, so the parent needs a size
 * (a height, for a `vertical` splitter). `ref` forwards to the container `<div>`.
 *
 * @example
 * ```tsx
 * <div style={{ height: 400 }}>
 *   <Splitter defaultLayout={[30, 70]} onLayoutCommit={save}>
 *     <Splitter.Pane minSize="12rem" collapsible>Sidebar</Splitter.Pane>
 *     <Splitter.Pane>Content</Splitter.Pane>
 *   </Splitter>
 * </div>
 * ```
 */
const SplitterRoot = forwardRef<HTMLDivElement, SplitterProps>(
  (
    {
      children,
      orientation = "horizontal",
      layout: layoutProp,
      defaultLayout,
      onLayoutChange,
      onLayoutCommit,
      variant = "line",
      keyboardStep = 5,
      disabled = false,
      dir = "ltr",
      labels,
      formatNumber = String,
      id,
      className,
      ...props
    },
    ref,
  ) => {
    const baseId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const resolvedOrientation = useResolvedResponsiveValue<SplitterOrientation>(orientation, "horizontal");
    const horizontal = resolvedOrientation === "horizontal";

    const allChildren = Children.toArray(children);
    const panes = allChildren.filter(isPane);
    const paneIds = panes.map(({ props: paneProps }, index) => paneProps.id ?? `${id ?? baseId}-pane-${index}`);
    // A pane's identity, so a layout survives panes coming and going: its `id`, else its `key`.
    const paneKeys = panes.map(({ props: paneProps, key }, index) => paneProps.id ?? (key != null ? String(key) : `index-${index}`));

    const hasWarnedChildrenRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (panes.length !== allChildren.length && !hasWarnedChildrenRef.current) {
        hasWarnedChildrenRef.current = true;
        console.warn(
          "Splitter: only `Splitter.Pane` elements, as direct children, are rendered — anything else (a wrapper, a fragment, plain text) is ignored. Put each pane directly inside `Splitter`.",
        );
      }
    }

    // The space the panes share, in pixels, measured from the real container (none in a server render).
    const [available, setAvailable] = useState(0);
    const [rootFontSize, setRootFontSize] = useState(16);
    const constraints = paneConstraints(panes, available, rootFontSize);

    const [ownLayout, setOwnLayout] = useState<{ keys: string[]; layout: number[] }>(() => ({
      keys: paneKeys,
      layout:
        defaultLayout && defaultLayout.length === panes.length
          ? normalizeLayout(defaultLayout, paneConstraints(panes, 0, 16))
          : startingLayout(panes, paneConstraints(panes, 0, 16)),
    }));
    const isControlled = layoutProp !== undefined;
    // Panes came or went: panes that are still there keep their sizes, and the rest is shared out (derived
    // state, set while rendering so the first paint already has the new layout).
    if (!isControlled && ownLayout.keys.join("\u0000") !== paneKeys.join("\u0000")) {
      setOwnLayout({
        keys: paneKeys,
        layout: adaptLayout(
          ownLayout.layout,
          ownLayout.keys,
          paneKeys,
          panes.map(({ props: paneProps }) => paneProps.defaultSize),
          constraints,
        ),
      });
    }
    const held = layoutProp ?? ownLayout.layout;
    const layout = held.length === panes.length ? held : startingLayout(panes, constraints);

    const hasWarnedLengthRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (isControlled && held.length !== panes.length && !hasWarnedLengthRef.current) {
        hasWarnedLengthRef.current = true;
        console.warn(
          `Splitter: \`layout\` has ${held.length} sizes for ${panes.length} panes, so it is ignored and the panes' own default sizes are used. Pass one percentage per pane.`,
        );
      }
    }
    const collapsedFlags = layout.map((size, index) => isCollapsed(size, constraints[index]));

    // Everything the event handlers need, kept current without making them depend on every render.
    const latest = useRef({
      layout,
      constraints,
      isControlled,
      onLayoutChange,
      onLayoutCommit,
      disabled,
      keyboardStep,
      dir,
      horizontal,
      panes,
      keys: paneKeys,
    });
    useLayoutEffect(() => {
      latest.current = {
        layout,
        constraints,
        isControlled,
        onLayoutChange,
        onLayoutCommit,
        disabled,
        keyboardStep,
        dir,
        horizontal,
        panes,
        keys: paneKeys,
      };
    });
    // The size a collapsed pane had, by pane, to open it again at.
    const restoreRef = useRef<Record<string, number>>({});
    // The layout a handle's reset goes back to, by pane: how the panes were laid out when the splitter mounted, or
    // when panes were last added or removed. Taken all at once, because sizes recorded at different moments would
    // not add up to proportions anyone had seen.
    const startingRef = useRef<Record<string, number>>({});
    const startingKey = paneKeys.join("\u0000");
    useLayoutEffect(() => {
      startingRef.current = Object.fromEntries(
        latest.current.keys.map((key, index) => [key, latest.current.layout[index] ?? 0]),
      );
    }, [startingKey]);
    const dragCleanupRef = useRef<(() => void) | null>(null);
    const [dragging, setDragging] = useState<number | null>(null);

    const commit = useCallback((next: number[]) => {
      const current = latest.current;
      if (sameLayout(current.layout, next)) return;
      next.forEach((size, index) => {
        const limits = current.constraints[index];
        if (isCollapsed(size, limits) && !isCollapsed(current.layout[index] ?? 0, limits)) {
          restoreRef.current[current.keys[index] ?? String(index)] = current.layout[index] ?? 0;
        }
      });
      latest.current = { ...current, layout: next };
      if (!current.isControlled) setOwnLayout((state) => ({ ...state, layout: next }));
      current.onLayoutChange?.(next);
    }, []);

    // Measure what the panes share, and again whenever the container (or a handle) changes size.
    const measure = useCallback(() => {
      const root = rootRef.current;
      if (!root) return 0;
      const isHorizontal = latest.current.horizontal;
      const whole = isHorizontal ? root.clientWidth : root.clientHeight;
      const handles = Array.from(root.children).filter((child) => child.getAttribute("role") === "separator");
      const used = handles.reduce((total, handle) => {
        const box = handle.getBoundingClientRect();
        return total + (isHorizontal ? box.width : box.height);
      }, 0);
      return Math.max(whole - used, 0);
    }, []);
    useLayoutEffect(() => {
      const remeasure = () => {
        setAvailable(measure());
        setRootFontSize(readRootFontSize());
      };
      remeasure();
      const root = rootRef.current;
      if (!root || typeof ResizeObserver === "undefined") return undefined;
      const observer = new ResizeObserver(remeasure);
      observer.observe(root);
      return () => observer.disconnect();
    }, [measure, horizontal, panes.length]);

    // A length limit becomes a different percentage when the container changes, and a pane's props can change
    // too: bring the layout back inside the limits, keeping a collapsed pane collapsed.
    const constraintsKey = constraints.map((c) => `${c.min}/${c.max}/${c.collapsed}`).join(",");
    const previousAvailableRef = useRef(0);
    useLayoutEffect(() => {
      const previous = previousAvailableRef.current;
      previousAvailableRef.current = available;
      if (available <= 0 && constraints.every((c) => c.min === 0 && c.max === 100)) return;
      const current = latest.current;
      const fixed = current.panes.map(({ props: paneProps }) => Boolean(paneProps.fixed));
      // A pane that keeps its length keeps it through a resize: its share of the new space is rescaled, and the
      // rest is shared out.
      if (previous > 0 && available > 0 && Math.abs(previous - available) > 0.5 && fixed.some(Boolean)) {
        commit(rescaleForContainer(current.layout, current.constraints, fixed, previous / available));
        return;
      }
      const pinned = current.constraints.map((limits, index) =>
        isCollapsed(current.layout[index] ?? 0, limits) ? { ...limits, min: limits.collapsed, max: limits.collapsed } : limits,
      );
      commit(normalizeLayout(current.layout, pinned));
      // eslint-disable-next-line react-hooks/exhaustive-deps -- reconciles when the limits change, not on every layout change
    }, [constraintsKey, available]);

    // Tell each pane when it collapses or opens, however that came about.
    const flagsKey = collapsedFlags.join(",");
    const previousFlagsRef = useRef<Record<string, boolean> | null>(null);
    useEffect(() => {
      const previous = previousFlagsRef.current;
      const keys = latest.current.keys;
      if (previous) {
        collapsedFlags.forEach((flag, index) => {
          const key = keys[index] ?? String(index);
          // A pane that has only just arrived has nothing to compare against, and isn't a change.
          if (key in previous && flag !== previous[key]) latest.current.panes[index]?.props.onCollapsedChange?.(flag);
        });
      }
      previousFlagsRef.current = Object.fromEntries(collapsedFlags.map((flag, index) => [keys[index] ?? String(index), flag]));
      // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when a pane's collapsed state changes
    }, [flagsKey]);

    // A pane whose `collapsed` prop is set follows it.
    const wantedKey = panes.map(({ props: paneProps }) => String(paneProps.collapsed)).join(",");
    useEffect(() => {
      const current = latest.current;
      current.panes.forEach(({ props: paneProps }, index) => {
        if (paneProps.collapsed === undefined) return;
        if (paneProps.collapsed === isCollapsed(current.layout[index] ?? 0, current.constraints[index])) return;
        const next = togglePane(current.layout, index, current.constraints, restoreRef.current[current.keys[index] ?? String(index)]);
        if (next) commit(next);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps -- follows the prop, and re-applies if the layout drifts from it
    }, [wantedKey, flagsKey]);

    useEffect(() => () => dragCleanupRef.current?.(), []);

    const startDrag = (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
      const current = latest.current;
      if (current.disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault();
      event.currentTarget.focus();
      const share = measure();
      const start = current.horizontal ? event.clientX : event.clientY;
      const direction = current.horizontal && current.dir === "rtl" ? -1 : 1;
      const base = current.layout;
      const handle = event.currentTarget;
      const pointerId = event.pointerId;
      setDragging(index);
      try {
        handle.setPointerCapture(pointerId);
      } catch {
        // A pointer that isn't active (a synthetic event, or one that has just ended) can't be captured; the
        // window listeners below carry the drag either way.
      }
      const move = (moveEvent: PointerEvent) => {
        const distance = ((current.horizontal ? moveEvent.clientX : moveEvent.clientY) - start) * direction;
        const percent = share > 0 ? (distance / share) * 100 : 0;
        commit(resizePair(base, index, (base[index] ?? 0) + percent, latest.current.constraints));
      };
      const finish = () => {
        dragCleanupRef.current?.();
        latest.current.onLayoutCommit?.(latest.current.layout);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);
      dragCleanupRef.current = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);
        try {
          handle.releasePointerCapture(pointerId);
        } catch {
          // Already released, or never captured (see above).
        }
        dragCleanupRef.current = null;
        setDragging(null);
      };
    };

    // What a double click or Enter does on a handle: collapse or open a collapsible pane beside it, or else set the
    // two panes back to the proportions they started in.
    const toggleAt = (index: number) => {
      const current = latest.current;
      // The pane before the handle collapses if it can; otherwise the one after it.
      const collapsible = current.constraints[index]?.collapsible ? index : current.constraints[index + 1]?.collapsible ? index + 1 : null;
      const next =
        collapsible !== null
          ? togglePane(current.layout, collapsible, current.constraints, restoreRef.current[current.keys[collapsible] ?? String(collapsible)])
          : resetPair(
              current.layout,
              index,
              current.keys.map((key) => startingRef.current[key]),
              current.constraints,
            );
      if (!next) return false;
      commit(next);
      current.onLayoutCommit?.(latest.current.layout);
      return true;
    };

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, index: number) => {
      const current = latest.current;
      if (current.disabled) return;
      const grow = current.horizontal ? (current.dir === "rtl" ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
      const shrink = current.horizontal ? (current.dir === "rtl" ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
      const size = current.layout[index] ?? 0;
      const step = current.keyboardStep;
      const desiredByKey: Record<string, number> = {
        [grow]: size + step,
        [shrink]: size - step,
        PageDown: size + step * 2,
        PageUp: size - step * 2,
        Home: Number.NEGATIVE_INFINITY,
        End: Number.POSITIVE_INFINITY,
      };
      if (event.key === "Enter") {
        if (toggleAt(index)) event.preventDefault();
        return;
      }
      const desired = desiredByKey[event.key];
      if (desired === undefined) return;
      event.preventDefault();
      commit(resizePair(current.layout, index, desired, current.constraints));
      current.onLayoutCommit?.(latest.current.layout);
    };

    const text: SplitterLabels = mergeDefined(defaultLabels(formatNumber), labels);
    const handleCount = Math.max(panes.length - 1, 0);
    // A handle beside a locked pane is a plain divider; the others are the handles people use and name.
    const isLocked = (index: number) =>
      panes[index]?.props.resizable === false || panes[index + 1]?.props.resizable === false;
    const resizableCount = Array.from({ length: handleCount }, (_, index) => index).filter((index) => !isLocked(index)).length;
    let resizablePosition = 0;

    const items: ReactElement[] = [];
    panes.forEach((pane, index) => {
      const size = layout[index] ?? 0;
      const limits = constraints[index];
      items.push(
        <PaneContext.Provider
          key={pane.key ?? `pane-${index}`}
          value={{
            id: paneIds[index] ?? `${baseId}-pane-${index}`,
            size,
            collapsed: collapsedFlags[index] ?? false,
            hidden: Boolean(collapsedFlags[index]) && (limits?.collapsed ?? 0) <= 0,
          }}
        >
          {pane}
        </PaneContext.Provider>,
      );
      if (index >= handleCount) return;
      if (isLocked(index)) {
        items.push(
          <div
            key={`handle-${index}`}
            role="separator"
            aria-orientation={horizontal ? "vertical" : "horizontal"}
            className={cx(styles.handle, styles.handleStatic)}
          />,
        );
        return;
      }
      resizablePosition += 1;
      const range = pairRange(layout, index, constraints);
      const open = !collapsedFlags[index];
      const percent = Math.round(size);
      items.push(
        // A focusable separator is a widget (the ARIA window-splitter pattern); the lint rule that treats every
        // separator as static content doesn't know that.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          key={`handle-${index}`}
          role="separator"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          aria-orientation={horizontal ? "vertical" : "horizontal"}
          aria-valuenow={percent}
          aria-valuemin={Math.round(range.min)}
          aria-valuemax={Math.round(range.max)}
          aria-valuetext={open ? text.valueText(percent) : text.collapsed}
          aria-controls={`${paneIds[index]} ${paneIds[index + 1]}`}
          aria-label={text.handle(resizablePosition, resizableCount, pane.props.label)}
          aria-disabled={disabled || undefined}
          data-state={dragging === index ? "dragging" : "idle"}
          className={cx(styles.handle, variant === "grip" && styles.grip, disabled && styles.handleDisabled)}
          onPointerDown={(event) => startDrag(event, index)}
          onKeyDown={(event) => onKeyDown(event, index)}
          onDoubleClick={() => {
            if (!latest.current.disabled) toggleAt(index);
          }}
        >
          {variant === "grip" && <span className={styles.gripMark} aria-hidden="true" />}
        </div>,
      );
    });

    return (
      // `{...props}` first, so the computed `dir`, `data-*` and class can't be replaced by a same-named prop.
      <div
        {...props}
        ref={mergeRefs(ref, rootRef)}
        id={id}
        dir={dir}
        data-orientation={resolvedOrientation}
        data-dragging={dragging !== null ? "" : undefined}
        className={cx(styles.root, horizontal ? styles.horizontal : styles.vertical, className)}
      >
        {items}
      </div>
    );
  },
);
SplitterRoot.displayName = "Splitter";

type SplitterComponent = typeof SplitterRoot & { Pane: typeof SplitterPane };

export const Splitter: SplitterComponent = Object.assign(SplitterRoot, { Pane: SplitterPane });
