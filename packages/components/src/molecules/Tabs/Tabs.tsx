import { cx, mergeRefs, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { createContext, forwardRef, useContext, useEffect, useMemo, useRef } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import styles from "./Tabs.module.css";
import type {
  TabsContentProps,
  TabsListProps,
  TabsOrientation,
  TabsProps,
  TabsSize,
  TabsTriggerProps,
  TabsVariant,
} from "./Tabs.types";

interface TabsContextValue {
  variant: TabsVariant;
  size: TabsSize;
  fullWidth: boolean;
  orientation: TabsOrientation;
}

// Every part reads the root's own settings from here rather than each taking
// them as a prop, so one `variant`/`size` on `Tabs` styles the whole set —
// and a `Tabs` inside another's panel is styled by its own root, not its
// parent's (which a descendant CSS selector could not promise).
const TabsContext = createContext<TabsContextValue>({
  variant: "underline",
  size: "md",
  fullWidth: false,
  orientation: "horizontal",
});

// One step down from the trigger's own size at the small end, the mapping
// `Button` uses, so an icon reads the same beside a label in either.
const iconSizeForTabsSize: Record<TabsSize, IconSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
};

const triggerSizeClass: Record<TabsSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const contentSizeClass: Record<TabsSize, string | undefined> = {
  xs: styles.contentXs,
  sm: styles.contentSm,
  md: styles.contentMd,
  lg: styles.contentLg,
  xl: styles.contentXl,
};

const triggerVariantClass: Record<TabsVariant, string | undefined> = {
  underline: styles.underline,
  subtle: styles.subtle,
  solid: styles.solid,
};

const listVariantClass: Record<TabsVariant, string | undefined> = {
  underline: styles.listUnderline,
  subtle: styles.listFilled,
  solid: styles.listFilled,
};

/**
 * Scrolls a horizontally scrolling list just far enough to show a tab in full.
 * Measured from bounding rectangles and applied with `scrollBy`, so it is the
 * same in a right-to-left list (where `scrollLeft` counts the other way) and
 * never scrolls the page itself, which `scrollIntoView` would.
 */
function revealTab(list: HTMLElement, tab: HTMLElement, behavior: ScrollBehavior): void {
  if (typeof list.scrollBy !== "function") return;
  const listRect = list.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  let delta = 0;
  if (tabRect.left < listRect.left) delta = tabRect.left - listRect.left;
  else if (tabRect.right > listRect.right) delta = tabRect.right - listRect.right;
  if (delta !== 0) list.scrollBy({ left: delta, behavior });
}

/**
 * A set of tabs, each switching which of several panels is showing, built on
 * Radix Tabs. A compound component: put a `Tabs.List` holding one
 * `Tabs.Trigger` per tab inside `Tabs`, and one `Tabs.Content` per trigger
 * beside it, matched by `value`. Wraps Radix Tabs' `Root`/`List`/`Trigger`/
 * `Content` fully, end to end.
 *
 * Uncontrolled with `defaultValue`, or controlled with `value`/
 * `onValueChange`. Pass one of them: with neither, no tab is selected and no
 * panel shows. `variant`, `size`, `orientation` and `fullWidth` are set once
 * here and apply to every part. `orientation` accepts a breakpoint map for a
 * vertical list that becomes a horizontal one on a phone. A horizontal list
 * that is wider than its container scrolls sideways, and keeps the selected tab
 * in view.
 *
 * `ref` forwards to the root `<div>`.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="overview">
 *   <Tabs.List aria-label="Project">
 *     <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
 *     <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
 *     <Tabs.Trigger value="settings" disabled>Settings</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="overview">A summary of the project.</Tabs.Content>
 *   <Tabs.Content value="activity">Recent changes.</Tabs.Content>
 *   <Tabs.Content value="settings">Project settings.</Tabs.Content>
 * </Tabs>
 * ```
 */
const TabsRoot = forwardRef<HTMLDivElement, TabsProps>((props, ref) => {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    variant = "underline",
    size = "md",
    orientation: orientationProp = "horizontal",
    activationMode = "automatic",
    fullWidth = false,
    dir,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = props;

  const orientation = useResolvedResponsiveValue<TabsOrientation>(orientationProp, "horizontal");

  const hasWarnedNoSelectionRef = useRef(false);
  const hasWarnedBothRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    if (value === undefined && defaultValue === undefined && !hasWarnedNoSelectionRef.current) {
      hasWarnedNoSelectionRef.current = true;
      console.warn(
        "Tabs: neither `value` nor `defaultValue` was passed, so no tab is selected and no panel shows. Pass `defaultValue` (uncontrolled) or `value` with `onValueChange` (controlled).",
      );
    }
    if (value !== undefined && defaultValue !== undefined && !hasWarnedBothRef.current) {
      hasWarnedBothRef.current = true;
      console.warn(
        "Tabs: `value` and `defaultValue` were both passed. `value` makes the tabs controlled, so `defaultValue` is ignored — remove one.",
      );
    }
  }

  const context = useMemo<TabsContextValue>(
    () => ({ variant, size, fullWidth, orientation }),
    [variant, size, fullWidth, orientation],
  );

  return (
    <TabsPrimitive.Root
      {...rest}
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      orientation={orientation}
      activationMode={activationMode}
      dir={dir}
      id={id}
      style={style}
      data-testid={dataTestId}
      // Radix sets this itself, but before spreading whatever else it is given,
      // so a stray consumer `data-orientation` would win. Setting it here, after
      // `rest`, keeps it the resolved value.
      data-orientation={orientation}
      className={cx(styles.root, className)}
    >
      <TabsContext.Provider value={context}>{children}</TabsContext.Provider>
    </TabsPrimitive.Root>
  );
});

TabsRoot.displayName = "Tabs";

/**
 * The row (or column) of `Tabs.Trigger`s — the `tablist`. Roving focus:
 * `Tab` enters it once, on the selected tab, and the arrow keys move between
 * tabs from there. When horizontal and wider than its container it scrolls
 * sideways, and it keeps the selected tab in view as the selection changes.
 */
const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ loop = true, className, children, ...props }, ref) => {
    const { variant, orientation } = useContext(TabsContext);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const list = listRef.current;
      if (!list || orientation !== "horizontal") return undefined;

      const activeTab = () => list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      // Instantly on the first look (a tab selected off-screen from the start
      // shouldn't be seen sliding into place), smoothly afterwards, and not at
      // all smoothly for a reader who asked for less motion.
      const prefersReducedMotion =
        typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const first = activeTab();
      if (first) revealTab(list, first, "auto");

      if (typeof MutationObserver === "undefined") return undefined;
      const observer = new MutationObserver(() => {
        const tab = activeTab();
        if (tab) revealTab(list, tab, prefersReducedMotion ? "auto" : "smooth");
      });
      observer.observe(list, { attributes: true, attributeFilter: ["data-state"], subtree: true });
      return () => observer.disconnect();
    }, [orientation]);

    return (
      <TabsPrimitive.List
        {...props}
        ref={mergeRefs(ref, listRef)}
        loop={loop}
        // Radix computes `aria-orientation` too, but before spreading whatever else it
        // is given, so a consumer's own would win. Computed here, after `props`, it
        // stays the resolved value even as a breakpoint map changes it.
        aria-orientation={orientation}
        data-orientation={orientation}
        className={cx(styles.list, listVariantClass[variant], className)}
      >
        {children}
      </TabsPrimitive.List>
    );
  },
);
TabsList.displayName = "Tabs.List";

/**
 * One tab. A real `<button role="tab">`, selected by a click (on press, as a
 * native tab does), or by focus when the tabs are `"automatic"`. Pairs with the
 * `Tabs.Content` that has the same `value`.
 */
const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>((triggerProps, ref) => {
  const { value, icon, asChild = false, className, children, ...props } = triggerProps;
  const { variant, size, fullWidth, orientation } = useContext(TabsContext);

  const hasWarnedIconRef = useRef(false);
  const hasWarnedNameRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    if (asChild && icon !== undefined && !hasWarnedIconRef.current) {
      hasWarnedIconRef.current = true;
      console.warn(
        "Tabs.Trigger: `icon` has no effect when `asChild` is set — the slotted child supplies its own content. Render the icon inside the child instead.",
      );
    }
    if (
      !asChild &&
      !children &&
      !props["aria-label"] &&
      !props["aria-labelledby"] &&
      !hasWarnedNameRef.current
    ) {
      hasWarnedNameRef.current = true;
      console.warn(
        "Tabs.Trigger: no accessible name — an icon-only tab has no visible label to name it. Pass `aria-label` (or `aria-labelledby`), or give it children.",
      );
    }
  }

  return (
    <TabsPrimitive.Trigger
      {...props}
      ref={ref}
      value={value}
      asChild={asChild}
      data-orientation={orientation}
      className={cx(
        styles.trigger,
        triggerSizeClass[size],
        triggerVariantClass[variant],
        fullWidth && styles.triggerFullWidth,
        className,
      )}
    >
      {asChild ? (
        children
      ) : (
        <>
          {icon && <Icon icon={icon} size={iconSizeForTabsSize[size]} className={styles.triggerIcon} />}
          {children !== undefined && children !== null && children !== false && (
            <span className={styles.triggerLabel}>{children}</span>
          )}
        </>
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = "Tabs.Trigger";

/**
 * The panel a tab reveals — a `tabpanel` named by its trigger, which is
 * focusable so a reader can `Tab` from the list straight into it. Unmounted
 * while its tab isn't selected, unless `forceMount` keeps it in the page.
 */
const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, children, ...props }, ref) => {
    const { size } = useContext(TabsContext);
    return (
      <TabsPrimitive.Content {...props} ref={ref} className={cx(styles.content, contentSizeClass[size], className)}>
        {children}
      </TabsPrimitive.Content>
    );
  },
);
TabsContent.displayName = "Tabs.Content";

type TabsComponent = typeof TabsRoot & {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
};

export const Tabs: TabsComponent = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
