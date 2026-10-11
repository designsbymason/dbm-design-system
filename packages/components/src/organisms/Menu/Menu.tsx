import { CaretRightIcon, CheckIcon, CircleIcon, MinusIcon } from "@dbm-design-system/icons";
import { cx, mergeRefs, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize, IconTone } from "../../atoms/Icon/Icon.types";
import styles from "./Menu.module.css";
import type {
  MenuCheckboxItemProps,
  MenuContentProps,
  MenuGroupProps,
  MenuItemProps,
  MenuLabelProps,
  MenuProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSeparatorProps,
  MenuSize,
  MenuSubContentProps,
  MenuSubProps,
  MenuSubTriggerProps,
  MenuTriggerProps,
} from "./Menu.types";
import {
  MenuGroupContext,
  MenuRadioValueContext,
  MenuRootContext,
  MenuSizeContext,
  MenuSubContext,
  useControllableState,
  type MenuGroupContextValue,
} from "./MenuContext";

/**
 * Records on the panel which kind of input was used last (`data-input` is `"pointer"` or `"keyboard"`), without a
 * render. Radix focuses an item as the pointer passes over it, which a browser may count as keyboard-style focus,
 * so the focus ring is drawn only while the panel is not marked `"pointer"`: hovering shows the quiet highlight
 * and the keyboard shows the ring.
 */
function trackInput<E extends HTMLElement>(own: {
  onPointerMove?: (event: PointerEvent<E>) => void;
  onPointerDown?: (event: PointerEvent<E>) => void;
  onKeyDown?: (event: KeyboardEvent<E>) => void;
}) {
  const mark = (event: { currentTarget: E }, input: "pointer" | "keyboard") => {
    event.currentTarget.dataset.input = input;
  };
  return {
    onPointerMove: (event: PointerEvent<E>) => {
      own.onPointerMove?.(event);
      mark(event, "pointer");
    },
    onPointerDown: (event: PointerEvent<E>) => {
      own.onPointerDown?.(event);
      mark(event, "pointer");
    },
    onKeyDown: (event: KeyboardEvent<E>) => {
      own.onKeyDown?.(event);
      mark(event, "keyboard");
    },
  };
}

const sizeClass: Record<MenuSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// Each step's icon takes the same `icon-size` step `Select`'s in-field icons do at that size.
const iconSizeFor: Record<MenuSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };
// The radio's dot is the filled circle glyph, which fills most of its box, so it takes a step less.
const dotSizeFor: Record<MenuSize, IconSize> = { xs: "xs", sm: "xs", md: "xs", lg: "sm", xl: "sm" };

/**
 * A floating list of actions opened from a trigger, built on Radix DropdownMenu: the arrow keys, typeahead,
 * Home/End, Escape and focus return, and `role="menu"` with `menuitem`s are Radix's. Reach for it for actions on
 * one thing (Edit, Duplicate, Delete) or for a few choices that act at once (a sort order, a view); it is not a
 * form field that picks a value (`Select`) and not a panel of arbitrary content (`Popover`).
 *
 * A compound component: `Menu.Trigger` and `Menu.Content` go inside `Menu`, and the content holds `Menu.Item`,
 * `Menu.CheckboxItem`, `Menu.RadioGroup` and `Menu.RadioItem`, `Menu.Label`, `Menu.Group`, `Menu.Separator` and
 * `Menu.Sub` (with `Menu.SubTrigger` and `Menu.SubContent`).
 *
 * `Menu` itself renders no DOM element, so it takes no `ref`, `className`, `style`, `id` or `data-testid`; those
 * apply to the parts, each of which forwards its own ref.
 *
 * It is modal by default, as a native menu is: the page behind is inert while it is open and a press outside only
 * closes it. The panel is portaled to the page and sits above a `Dialog` it was opened from.
 *
 * @example
 * ```tsx
 * <Menu>
 *   <Menu.Trigger asChild>
 *     <IconButton icon={DotsThreeIcon} aria-label="Row actions" />
 *   </Menu.Trigger>
 *   <Menu.Content>
 *     <Menu.Item icon={PencilIcon} shortcut="⌘E" onSelect={edit}>Edit</Menu.Item>
 *     <Menu.Item icon={CopyIcon} onSelect={duplicate}>Duplicate</Menu.Item>
 *     <Menu.Separator />
 *     <Menu.Item icon={TrashIcon} tone="danger" onSelect={remove}>Delete</Menu.Item>
 *   </Menu.Content>
 * </Menu>
 * ```
 */
function MenuRoot({ children, open, defaultOpen = false, onOpenChange, modal = true, dir = "ltr" }: MenuProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);
  const focusLastRef = useRef(false);
  const openToLast = useCallback(() => {
    focusLastRef.current = true;
    setOpen(true);
  }, [setOpen]);
  const value = useMemo(() => ({ open: isOpen, dir, openToLast, focusLastRef }), [isOpen, dir, openToLast]);
  return (
    <MenuRootContext.Provider value={value}>
      <MenuPrimitive.Root open={isOpen} onOpenChange={setOpen} modal={modal} dir={dir}>
        {children}
      </MenuPrimitive.Root>
    </MenuRootContext.Provider>
  );
}

/**
 * The element that opens and closes the menu. Renders an unstyled native `<button>` by default; pass `asChild` to
 * use `Button` or `IconButton` instead. Enter, Space and ArrowDown open it, ArrowDown or ArrowUp placing focus on
 * the first or last item.
 */
const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(
  ({ asChild = false, className, onKeyDown, ...props }, ref) => {
    const { open, openToLast } = useContext(MenuRootContext);
    return (
      <MenuPrimitive.Trigger
        ref={ref}
        asChild={asChild}
        className={asChild ? className : cx(styles.trigger, className)}
        {...props}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // ArrowDown, Enter and Space are Radix's. ArrowUp opens too, onto the last item, as the menu-button
          // pattern allows and a person who came from the bottom of a list expects.
          if (event.defaultPrevented || event.key !== "ArrowUp" || props.disabled) return;
          event.preventDefault();
          openToLast();
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      />
    );
  },
);
MenuTrigger.displayName = "Menu.Trigger";

/**
 * The floating panel, rendered in a portal on the document body. It scrolls when taller than the room there is, is
 * named after its trigger, and takes the row size for every item inside it.
 */
const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(
  (
    {
      size = "md",
      side = "bottom",
      align = "start",
      sideOffset = 4,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      container,
      className,
      children,
      onPointerMove,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const { open, focusLastRef } = useContext(MenuRootContext);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref]);
    // Opened with ArrowUp: once Radix has put focus on its first item, move it to the last one that can have it.
    // Radix gives a dropdown no hook for where focus lands as it opens, so this waits one frame for it to settle.
    useEffect(() => {
      if (!open || !focusLastRef.current) return undefined;
      focusLastRef.current = false;
      const frame = requestAnimationFrame(() => {
        const items = contentRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]',
        );
        [...(items ?? [])].reverse().find((item) => !item.hasAttribute("data-disabled"))?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }, [open, focusLastRef]);
    // Radix's `side` is one concrete value per render: it drives a computed position, not a CSS cascade, so a
    // responsive map is resolved to a single value in JS first.
    const resolvedSide = useResolvedResponsiveValue(side, "bottom");
    return (
      <MenuPrimitive.Portal container={container}>
        <MenuPrimitive.Content
          ref={mergedRef}
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          className={cx(styles.content, sizeClass[size], className)}
          {...props}
          {...trackInput<HTMLDivElement>({ onPointerMove, onPointerDown, onKeyDown })}
          role="menu"
          aria-orientation="vertical"
        >
          <MenuSizeContext.Provider value={size}>{children}</MenuSizeContext.Provider>
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    );
  },
);
MenuContent.displayName = "Menu.Content";

interface ItemBodyProps {
  icon: MenuItemProps["icon"];
  shortcut: MenuItemProps["shortcut"];
  size: MenuSize;
  iconTone: IconTone;
  children: ReactNode;
}

/** What every item draws: an optional leading icon, the label, and an optional shortcut hint at the end. */
function ItemBody({ icon, shortcut, size, iconTone, children }: ItemBodyProps) {
  return (
    <>
      {icon && <Icon icon={icon} size={iconSizeFor[size]} tone={iconTone} className={styles.icon} />}
      <span className={styles.label}>{children}</span>
      {shortcut !== undefined && shortcut !== null && <kbd className={styles.shortcut}>{shortcut}</kbd>}
    </>
  );
}

/**
 * An action. `onSelect` runs when it is chosen, by a click, Enter or Space, and the menu closes afterwards unless
 * the handler calls `event.preventDefault()`. Pass `asChild` with a link to make a navigation item.
 */
const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(
  (
    {
      asChild = false,
      icon,
      shortcut,
      tone = "neutral",
      disabled = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const size = useContext(MenuSizeContext);
    const ignoresContent = asChild && Boolean(icon || shortcut);
    useEffect(() => {
      if (process.env.NODE_ENV === "production" || !ignoresContent) return;
      console.warn(
        "Menu.Item: `icon` and `shortcut` have no effect when `asChild` is set — the item draws none of its own content in that mode, since Radix `Slot` requires exactly one child. Put the icon and the hint inside the child, or remove `asChild`.",
      );
    }, [ignoresContent]);
    const iconTone: IconTone = disabled ? "disabled" : tone === "danger" ? "danger" : "default";
    return (
      <MenuPrimitive.Item
        ref={ref}
        asChild={asChild}
        disabled={disabled}
        className={cx(styles.item, tone === "danger" && styles.danger, className)}
        {...props}
        role="menuitem"
        aria-disabled={disabled || undefined}
      >
        {asChild ? (
          children
        ) : (
          <ItemBody icon={icon} shortcut={shortcut} size={size} iconTone={iconTone}>
            {children}
          </ItemBody>
        )}
      </MenuPrimitive.Item>
    );
  },
);
MenuItem.displayName = "Menu.Item";

/**
 * An item that toggles something on or off and shows it with a check mark in its leading column. It is
 * uncontrolled with `defaultChecked`, or controlled with `checked`; `"indeterminate"` draws a dash for a mixed state.
 */
const MenuCheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  (
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      icon,
      shortcut,
      disabled = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const size = useContext(MenuSizeContext);
    const [value, setValue] = useControllableState<boolean | "indeterminate">(checked, defaultChecked, (next) =>
      onCheckedChange?.(next === true),
    );
    return (
      <MenuPrimitive.CheckboxItem
        ref={ref}
        checked={value}
        onCheckedChange={(next) => setValue(next)}
        disabled={disabled}
        className={cx(styles.item, styles.indicated, className)}
        {...props}
        role="menuitemcheckbox"
        aria-checked={value === "indeterminate" ? "mixed" : value}
        aria-disabled={disabled || undefined}
      >
        <MenuPrimitive.ItemIndicator className={styles.indicator}>
          <Icon icon={value === "indeterminate" ? MinusIcon : CheckIcon} size={iconSizeFor[size]} tone="brand" />
        </MenuPrimitive.ItemIndicator>
        <ItemBody icon={icon} shortcut={shortcut} size={size} iconTone={disabled ? "disabled" : "default"}>
          {children}
        </ItemBody>
      </MenuPrimitive.CheckboxItem>
    );
  },
);
MenuCheckboxItem.displayName = "Menu.CheckboxItem";

function useGroupLabelling(ariaLabelledBy: string | undefined) {
  const [labelId, setLabelId] = useState<string | undefined>(undefined);
  const context = useMemo<MenuGroupContextValue>(() => ({ setLabelId }), []);
  return { context, labelledBy: ariaLabelledBy ?? labelId };
}

/**
 * A set of items that go together, named by a `Menu.Label` inside it (wired automatically) or by `aria-label`.
 */
const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(
  ({ className, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const { context, labelledBy } = useGroupLabelling(ariaLabelledBy);
    return (
      <MenuGroupContext.Provider value={context}>
        <MenuPrimitive.Group
          ref={ref}
          className={className}
          {...props}
          role="group"
          aria-labelledby={labelledBy}
        />
      </MenuGroupContext.Provider>
    );
  },
);
MenuGroup.displayName = "Menu.Group";

/**
 * A set of `Menu.RadioItem`s of which one is chosen, named by a `Menu.Label` inside it or by `aria-label`. It is
 * uncontrolled with `defaultValue`, or controlled with `value` and `onValueChange`.
 */
const MenuRadioGroup = forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  ({ value, defaultValue = "", onValueChange, className, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const { context, labelledBy } = useGroupLabelling(ariaLabelledBy);
    const [current, setCurrent] = useControllableState<string>(value, defaultValue, onValueChange);
    return (
      <MenuGroupContext.Provider value={context}>
        <MenuRadioValueContext.Provider value={current}>
          <MenuPrimitive.RadioGroup
            ref={ref}
            value={current}
            onValueChange={setCurrent}
            className={className}
            {...props}
            role="group"
            aria-labelledby={labelledBy}
          />
        </MenuRadioValueContext.Provider>
      </MenuGroupContext.Provider>
    );
  },
);
MenuRadioGroup.displayName = "Menu.RadioGroup";

/**
 * One choice in a `Menu.RadioGroup`, shown with a dot in its leading column while it is the chosen one.
 */
const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(
  ({ icon, shortcut, disabled = false, className, children, value, ...props }, ref) => {
    const size = useContext(MenuSizeContext);
    const chosen = useContext(MenuRadioValueContext);
    return (
      <MenuPrimitive.RadioItem
        ref={ref}
        value={value}
        disabled={disabled}
        className={cx(styles.item, styles.indicated, className)}
        {...props}
        role="menuitemradio"
        aria-checked={chosen === value}
        aria-disabled={disabled || undefined}
      >
        <MenuPrimitive.ItemIndicator className={styles.indicator}>
          <Icon icon={CircleIcon} weight="fill" size={dotSizeFor[size]} tone="brand" />
        </MenuPrimitive.ItemIndicator>
        <ItemBody icon={icon} shortcut={shortcut} size={size} iconTone={disabled ? "disabled" : "default"}>
          {children}
        </ItemBody>
      </MenuPrimitive.RadioItem>
    );
  },
);
MenuRadioItem.displayName = "Menu.RadioItem";

/**
 * A heading for a group of items. Inside a `Menu.Group` or `Menu.RadioGroup` it names that group for assistive
 * technology; it is not itself an item and can't be focused.
 */
const MenuLabel = forwardRef<HTMLDivElement, MenuLabelProps>(({ className, id, ...props }, ref) => {
  const group = useContext(MenuGroupContext);
  const generatedId = useId();
  const labelId = id ?? generatedId;
  useEffect(() => {
    group?.setLabelId(labelId);
    return () => group?.setLabelId(undefined);
  }, [group, labelId]);
  return <MenuPrimitive.Label ref={ref} className={cx(styles.heading, className)} {...props} id={labelId} />;
});
MenuLabel.displayName = "Menu.Label";

/** A line between two sets of items. */
const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator ref={ref} className={cx(styles.separator, className)} {...props} />
));
MenuSeparator.displayName = "Menu.Separator";

/**
 * The root of a submenu: a `Menu.SubTrigger` item that opens a `Menu.SubContent` beside it. A submenu may hold
 * submenus of its own.
 */
function MenuSub({ children, open, onOpenChange }: MenuSubProps) {
  const [isOpen, setOpen] = useControllableState(open, false, onOpenChange);
  const value = useMemo(() => ({ open: isOpen }), [isOpen]);
  return (
    <MenuSubContext.Provider value={value}>
      <MenuPrimitive.Sub open={isOpen} onOpenChange={setOpen}>
        {children}
      </MenuPrimitive.Sub>
    </MenuSubContext.Provider>
  );
}

/**
 * The item that opens a submenu, drawn with a caret at its end that points the way the submenu will open.
 * ArrowRight (ArrowLeft in right-to-left text) opens it; the opposite key closes it again.
 */
const MenuSubTrigger = forwardRef<HTMLDivElement, MenuSubTriggerProps>(
  ({ icon, disabled = false, className, children, ...props }, ref) => {
    const size = useContext(MenuSizeContext);
    const { dir } = useContext(MenuRootContext);
    const sub = useContext(MenuSubContext);
    return (
      <MenuPrimitive.SubTrigger
        ref={ref}
        disabled={disabled}
        className={cx(styles.item, className)}
        {...props}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={sub?.open ?? false}
        aria-disabled={disabled || undefined}
      >
        <ItemBody icon={icon} shortcut={undefined} size={size} iconTone={disabled ? "disabled" : "default"}>
          {children}
        </ItemBody>
        <Icon
          icon={CaretRightIcon}
          size={iconSizeFor[size]}
          tone={disabled ? "disabled" : "default"}
          mirrored={dir === "rtl"}
          className={styles.caret}
        />
      </MenuPrimitive.SubTrigger>
    );
  },
);
MenuSubTrigger.displayName = "Menu.SubTrigger";

/**
 * The submenu's panel, portaled and positioned beside its trigger on the side the reading direction opens to.
 */
const MenuSubContent = forwardRef<HTMLDivElement, MenuSubContentProps>(
  (
    {
      size,
      alignOffset = -5,
      collisionPadding = 8,
      container,
      className,
      children,
      onPointerMove,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const parentSize = useContext(MenuSizeContext);
    const resolved = size ?? parentSize;
    return (
      <MenuPrimitive.Portal container={container}>
        <MenuPrimitive.SubContent
          ref={ref}
          alignOffset={alignOffset}
          collisionPadding={collisionPadding}
          className={cx(styles.content, sizeClass[resolved], className)}
          {...props}
          {...trackInput<HTMLDivElement>({ onPointerMove, onPointerDown, onKeyDown })}
          role="menu"
          aria-orientation="vertical"
        >
          <MenuSizeContext.Provider value={resolved}>{children}</MenuSizeContext.Provider>
        </MenuPrimitive.SubContent>
      </MenuPrimitive.Portal>
    );
  },
);
MenuSubContent.displayName = "Menu.SubContent";

type MenuComponent = typeof MenuRoot & {
  Trigger: typeof MenuTrigger;
  Content: typeof MenuContent;
  Item: typeof MenuItem;
  CheckboxItem: typeof MenuCheckboxItem;
  RadioGroup: typeof MenuRadioGroup;
  RadioItem: typeof MenuRadioItem;
  Label: typeof MenuLabel;
  Group: typeof MenuGroup;
  Separator: typeof MenuSeparator;
  Sub: typeof MenuSub;
  SubTrigger: typeof MenuSubTrigger;
  SubContent: typeof MenuSubContent;
};

export const Menu: MenuComponent = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  Label: MenuLabel,
  Group: MenuGroup,
  Separator: MenuSeparator,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
  SubContent: MenuSubContent,
});
