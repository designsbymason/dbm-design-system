import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon } from "@dbm-design-system/icons";
import { cx, mergeRefs, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import * as ToolbarPrimitive from "@radix-ui/react-toolbar";
import { createContext, forwardRef, useCallback, useContext, useMemo, useRef } from "react";
import type { Ref } from "react";
import { Affix } from "../../atoms/Affix";
import { Button } from "../../atoms/Button";
import type { ButtonProps } from "../../atoms/Button";
import { ButtonGroupProvider, useButtonGroup } from "../../atoms/Button/buttonGroupContext";
import { Icon } from "../../atoms/Icon";
import { IconButton } from "../../atoms/IconButton";
import type { IconButtonProps } from "../../atoms/IconButton";
import { Spacer } from "../../atoms/Spacer";
import { ButtonGroup } from "../ButtonGroup";
import { ToggleGroup } from "../ToggleGroup";
import type { ToggleGroupItemProps, ToggleGroupProps } from "../ToggleGroup";
import styles from "./Toolbar.module.css";
import type {
  ToolbarAlign,
  ToolbarDirection,
  ToolbarGroupProps,
  ToolbarItemProps,
  ToolbarOrientation,
  ToolbarProps,
  ToolbarSeparatorProps,
  ToolbarSpacerProps,
  ToolbarToggleGroupProps,
} from "./Toolbar.types";
import { useScrollEdges } from "./useScrollEdges";

/** What the parts need to know about the bar they sit in. */
interface ToolbarContextValue {
  /** Whether the whole bar is disabled, so an item leaves the arrow-key order. */
  disabled: boolean;
  size: NonNullable<ToolbarProps["size"]>;
  rounded: boolean;
  orientation: ToolbarOrientation;
  dir: ToolbarDirection;
}

const ToolbarContext = createContext<ToolbarContextValue>({
  disabled: false,
  size: "md",
  rounded: false,
  orientation: "horizontal",
  dir: "ltr",
});

/** Whether the `Toolbar.ToggleGroup` an item sits in is disabled, so the item leaves the arrow-key order with it. */
const ToggleGroupDisabledContext = createContext(false);

const alignValues: ToolbarAlign[] = ["start", "center", "end"];

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * A bar of actions that is one tab stop: `Tab` moves focus into the toolbar and out again, and the arrow keys
 * (`Home` and `End` too) move between its items — left and right for a row, up and down for a column. Built on
 * Radix `Toolbar`, it is a `role="toolbar"` with a name, and it hands its `itemVariant`, `size`, `rounded` and
 * `disabled` to the `Toolbar.Button`s and `Toolbar.IconButton`s inside it as defaults — an item's own prop still wins.
 *
 * Parts: `Toolbar.Button`, `Toolbar.IconButton` (the `Button` and `IconButton` atoms, in the arrow-key order),
 * `Toolbar.ToggleGroup` with `Toolbar.ToggleItem` (a single or multiple choice, in the order), `Toolbar.Item` (any other
 * single focusable element: a `Select`, a menu or popover trigger, a link), `Toolbar.Group` (a named set of items,
 * `attached` to fuse them), `Toolbar.Separator` and `Toolbar.Spacer` (pushes what follows to the far end). A pressed state
 * on an icon button (`pressed`) makes it a toggle, and `tooltip` on one shows its name on hover and focus. Don't put a text
 * field in a toolbar: it needs the arrow keys itself.
 *
 * When there are more items than fit, `overflow` wraps them or scrolls the bar; `sticky` keeps it at the top of the page.
 *
 * @example
 * ```tsx
 * <Toolbar aria-label="Text formatting">
 *   <Toolbar.Group aria-label="Style" attached>
 *     <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" tooltip />
 *     <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" tooltip />
 *   </Toolbar.Group>
 *   <Toolbar.Separator />
 *   <Toolbar.ToggleGroup aria-label="Alignment" defaultValue="left">
 *     <Toolbar.ToggleItem value="left" icon={TextAlignLeftIcon} aria-label="Left" />
 *     <Toolbar.ToggleItem value="center" icon={TextAlignCenterIcon} aria-label="Centre" />
 *   </Toolbar.ToggleGroup>
 *   <Toolbar.Spacer />
 *   <Toolbar.Button variant="primary">Save</Toolbar.Button>
 * </Toolbar>
 * ```
 */
const ToolbarRoot = forwardRef<HTMLDivElement, ToolbarProps>(
  (
    {
      children,
      variant = "ghost",
      itemVariant = "ghost",
      size = "md",
      rounded = false,
      disabled = false,
      orientation = "horizontal",
      dir = "ltr",
      loop = true,
      fullWidth = false,
      align = "start",
      overflow = "visible",
      sticky = false,
      stickyOffset = 0,
      scrollContainerRef,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const resolvedOrientation = useResolvedResponsiveValue<ToolbarOrientation>(orientation, "horizontal");
    const isScroller = overflow === "scroll";
    const barRef = useRef<HTMLDivElement>(null);
    const { overflowStart, overflowEnd } = useScrollEdges(barRef, resolvedOrientation, isScroller);

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (!ariaLabel && !ariaLabelledBy && !hasWarnedNoAccessibleNameRef.current) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Toolbar: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say what the toolbar is for.",
        );
      }
    }

    // A toolbar inside a `ButtonGroup` (or the reverse) keeps what the outer one set for whatever this one leaves
    // out, and a disabled outer group disables this one's items too — the same merge `ButtonGroup` does.
    const parent = useButtonGroup();
    const parentDisabled = parent?.disabled;
    const buttonSettings = useMemo(
      () => ({
        variant: itemVariant,
        size,
        rounded: rounded || (parent?.rounded ?? false),
        disabled: disabled || parentDisabled,
      }),
      [itemVariant, size, rounded, parent?.rounded, disabled, parentDisabled],
    );
    const toolbarSettings = useMemo<ToolbarContextValue>(
      () => ({
        disabled: Boolean(buttonSettings.disabled),
        size,
        rounded: Boolean(buttonSettings.rounded),
        orientation: resolvedOrientation,
        dir,
      }),
      [buttonSettings.disabled, buttonSettings.rounded, size, resolvedOrientation, dir],
    );

    // Scrolling a bar by a button moves it most of its own length, the way a person pages a strip.
    const scrollBar = useCallback(
      (direction: 1 | -1) => {
        const bar = barRef.current;
        if (!bar || typeof bar.scrollBy !== "function") return;
        const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
        if (resolvedOrientation === "vertical") bar.scrollBy({ top: bar.clientHeight * 0.75 * direction, behavior });
        else bar.scrollBy({ left: bar.clientWidth * 0.75 * direction * (dir === "rtl" ? -1 : 1), behavior });
      },
      [resolvedOrientation, dir],
    );

    // What the bar looks like: on the bar itself, or, when it scrolls, on the frame around it (the frame is the box the
    // fades and buttons sit inside, so it has to be the one with the surface).
    const surfaceClasses = cx(
      sticky && styles.sticky,
      variant === "outlined" && styles.outlined,
      variant === "filled" && styles.filled,
      rounded && styles.rounded,
      fullWidth && styles.fullWidth,
    );

    const bar = (
      <ToolbarPrimitive.Root
        ref={mergeRefs(ref, barRef)}
        {...props}
        orientation={resolvedOrientation}
        dir={dir}
        loop={loop}
        // Applied after `{...props}` so a same-named consumer prop can never replace them
        // (05-component-api-conventions.md §3).
        role="toolbar"
        aria-orientation={resolvedOrientation}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        data-orientation={resolvedOrientation}
        data-size={size}
        data-align={alignValues.includes(align) ? align : "start"}
        className={cx(
          styles.root,
          variant === "ghost" && styles.ghost,
          isScroller ? styles.scroller : surfaceClasses,
          overflow === "wrap" && styles.wrap,
          className,
        )}
      >
        {children}
      </ToolbarPrimitive.Root>
    );

    const StartIcon = resolvedOrientation === "vertical" ? CaretUpIcon : dir === "rtl" ? CaretRightIcon : CaretLeftIcon;
    const EndIcon = resolvedOrientation === "vertical" ? CaretDownIcon : dir === "rtl" ? CaretLeftIcon : CaretRightIcon;

    const content = isScroller ? (
      <div
        className={cx(styles.frame, surfaceClasses)}
        data-orientation={resolvedOrientation}
        data-variant={variant}
        data-overflow-start={overflowStart}
        data-overflow-end={overflowEnd}
        // The frame is the outermost element, so a sticky bar sticks as one box, fades and buttons with it.
        dir={dir}
      >
        {/* The buttons are for a pointer: the arrow keys already move focus along the bar and the browser scrolls the
            focused item into view, so they are out of the tab order and hidden from assistive tech, and a press on one
            never takes focus (which would otherwise be lost when it disappears at the end). */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className={cx(styles.scrollButton, styles.scrollButtonStart)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (overflowStart) scrollBar(-1);
          }}
        >
          <Icon icon={StartIcon} size="sm" />
        </button>
        {bar}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className={cx(styles.scrollButton, styles.scrollButtonEnd)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (overflowEnd) scrollBar(1);
          }}
        >
          <Icon icon={EndIcon} size="sm" />
        </button>
      </div>
    ) : (
      bar
    );

    return (
      <ToolbarContext.Provider value={toolbarSettings}>
        <ButtonGroupProvider value={buttonSettings}>
          {sticky ? (
            <Affix asChild offset={stickyOffset} scrollContainerRef={scrollContainerRef}>
              {content}
            </Affix>
          ) : (
            content
          )}
        </ButtonGroupProvider>
      </ToolbarContext.Provider>
    );
  },
);
ToolbarRoot.displayName = "Toolbar";

/**
 * A `Button` in the toolbar's arrow-key order. Takes every `Button` prop; its `variant`, `size`, `rounded` and
 * `disabled` default to the toolbar's.
 */
const ToolbarButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const toolbar = useContext(ToolbarContext);
  const disabled = Boolean(props.disabled) || toolbar.disabled || Boolean(props.isLoading);
  return (
    <ToolbarPrimitive.Button asChild disabled={disabled}>
      <Button ref={ref} {...props} />
    </ToolbarPrimitive.Button>
  );
});
ToolbarButton.displayName = "Toolbar.Button";

/**
 * An `IconButton` in the toolbar's arrow-key order. Takes every `IconButton` prop, including `pressed` for a toggle
 * and `tooltip` for a hover and focus label; its `variant`, `size`, `rounded` and `disabled` default to the toolbar's.
 */
const ToolbarIconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const toolbar = useContext(ToolbarContext);
  const disabled = Boolean(props.disabled) || toolbar.disabled || Boolean(props.isLoading);
  return (
    <ToolbarPrimitive.Button asChild disabled={disabled}>
      <IconButton ref={ref} {...props} />
    </ToolbarPrimitive.Button>
  );
});
ToolbarIconButton.displayName = "Toolbar.IconButton";

/**
 * Puts any one focusable element — a `Select`, a menu or popover trigger, a link, a `Button` wrapped in something — into
 * the toolbar's arrow-key order. It renders its only child, handing it the roving tab index and key handling.
 */
const ToolbarItem = forwardRef<HTMLElement, ToolbarItemProps>(({ children, disabled = false }, ref) => {
  const toolbar = useContext(ToolbarContext);
  return (
    <ToolbarPrimitive.Button asChild ref={ref as Ref<HTMLButtonElement>} disabled={disabled || toolbar.disabled}>
      {children}
    </ToolbarPrimitive.Button>
  );
});
ToolbarItem.displayName = "Toolbar.Item";

/**
 * A named `role="group"` of related items inside the toolbar, laid out as one cluster; `attached` fuses its buttons into a
 * segmented control (it then renders a `ButtonGroup`, whose settings it shares with the bar).
 */
const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ children, attached = false, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const toolbar = useContext(ToolbarContext);
    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      // An attached group is a `ButtonGroup`, which warns about a missing name itself.
      if (!attached && !ariaLabel && !ariaLabelledBy && !hasWarnedNoAccessibleNameRef.current) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Toolbar.Group: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say what the group is for.",
        );
      }
    }
    if (attached) {
      return (
        <ButtonGroup
          ref={ref}
          {...props}
          orientation={toolbar.orientation}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={className}
        >
          {children}
        </ButtonGroup>
      );
    }
    return (
      <div
        ref={ref}
        {...props}
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cx(styles.group, className)}
      >
        {children}
      </div>
    );
  },
);
ToolbarGroup.displayName = "Toolbar.Group";

/**
 * A single or multiple choice in the toolbar's arrow-key order — a `ToggleGroup` with its own roving focus turned off, so
 * the toolbar stays one tab stop and its arrow keys run straight through the group's items (`Toolbar.ToggleItem`). Single
 * is a `radiogroup` (an arrow key chooses the item it lands on, as in a native radio group); multiple is a plain `group`
 * of independent toggles. Takes every `ToggleGroup` prop except `loop` and `rovingFocus`; its `size`, `rounded`,
 * `disabled`, `orientation` and `dir` default to the toolbar's.
 */
const ToolbarToggleGroup = forwardRef<HTMLDivElement, ToolbarToggleGroupProps>((props, ref) => {
  const toolbar = useContext(ToolbarContext);
  const group = props as ToggleGroupProps;
  // Disabled by the bar or by the group: a group's own `disabled={false}` can't undo the bar's.
  const disabled = Boolean(group.disabled) || toolbar.disabled;
  return (
    <ToggleGroupDisabledContext.Provider value={disabled}>
      <ToggleGroup
        ref={ref}
        {...group}
        rovingFocus={false}
        size={group.size ?? toolbar.size}
        rounded={group.rounded ?? toolbar.rounded}
        orientation={group.orientation ?? toolbar.orientation}
        dir={group.dir ?? toolbar.dir}
        disabled={disabled}
      />
    </ToggleGroupDisabledContext.Provider>
  );
});
ToolbarToggleGroup.displayName = "Toolbar.ToggleGroup";

/** One choice in a `Toolbar.ToggleGroup`, in the toolbar's arrow-key order. Takes every `ToggleGroup.Item` prop. */
const ToolbarToggleItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>((props, ref) => {
  const toolbar = useContext(ToolbarContext);
  const groupDisabled = useContext(ToggleGroupDisabledContext);
  const disabled = Boolean(props.disabled) || groupDisabled || toolbar.disabled;
  return (
    <ToolbarPrimitive.Button asChild disabled={disabled}>
      <ToggleGroup.Item ref={ref} {...props} />
    </ToolbarPrimitive.Button>
  );
});
ToolbarToggleItem.displayName = "Toolbar.ToggleItem";

/** A line between items, across the toolbar's own direction (a vertical rule in a row). Announced as a separator. */
const ToolbarSeparator = forwardRef<HTMLDivElement, ToolbarSeparatorProps>(({ className, ...props }, ref) => (
  <ToolbarPrimitive.Separator ref={ref} {...props} className={cx(styles.separator, className)} />
));
ToolbarSeparator.displayName = "Toolbar.Separator";

/** Flexible empty space that pushes whatever follows it to the far end of the toolbar. Hidden from assistive tech. */
const ToolbarSpacer = forwardRef<HTMLDivElement, ToolbarSpacerProps>((props, ref) => <Spacer ref={ref} {...props} />);
ToolbarSpacer.displayName = "Toolbar.Spacer";

type ToolbarComponent = typeof ToolbarRoot & {
  Button: typeof ToolbarButton;
  IconButton: typeof ToolbarIconButton;
  Item: typeof ToolbarItem;
  Group: typeof ToolbarGroup;
  ToggleGroup: typeof ToolbarToggleGroup;
  ToggleItem: typeof ToolbarToggleItem;
  Separator: typeof ToolbarSeparator;
  Spacer: typeof ToolbarSpacer;
};

export const Toolbar: ToolbarComponent = Object.assign(ToolbarRoot, {
  Button: ToolbarButton,
  IconButton: ToolbarIconButton,
  Item: ToolbarItem,
  Group: ToolbarGroup,
  ToggleGroup: ToolbarToggleGroup,
  ToggleItem: ToolbarToggleItem,
  Separator: ToolbarSeparator,
  Spacer: ToolbarSpacer,
});

