import { cx, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import * as ToolbarPrimitive from "@radix-ui/react-toolbar";
import { createContext, forwardRef, useContext, useMemo, useRef } from "react";
import { Button } from "../../atoms/Button";
import type { ButtonProps } from "../../atoms/Button";
import { ButtonGroupProvider, useButtonGroup } from "../../atoms/Button/buttonGroupContext";
import { IconButton } from "../../atoms/IconButton";
import type { IconButtonProps } from "../../atoms/IconButton";
import { Spacer } from "../../atoms/Spacer";
import styles from "./Toolbar.module.css";
import type {
  ToolbarGroupProps,
  ToolbarItemProps,
  ToolbarOrientation,
  ToolbarProps,
  ToolbarSeparatorProps,
  ToolbarSpacerProps,
} from "./Toolbar.types";

/** What the parts need to know about the bar they sit in: whether it is disabled, to leave arrow-key order. */
const ToolbarContext = createContext<{ disabled: boolean }>({ disabled: false });

/**
 * A bar of actions that is one tab stop: `Tab` moves focus into the toolbar and out again, and the arrow keys
 * (`Home` and `End` too) move between its items — left and right for a row, up and down for a column. Built on
 * Radix `Toolbar`, it is a `role="toolbar"` with a name, and it hands its `itemVariant`, `size`, `rounded` and
 * `disabled` to the `Toolbar.Button`s and `Toolbar.IconButton`s inside it as defaults — an item's own prop still wins.
 *
 * Parts: `Toolbar.Button`, `Toolbar.IconButton` (the `Button` and `IconButton` atoms, in the arrow-key order),
 * `Toolbar.Item` (any other single focusable element), `Toolbar.Group` (a named set of items), `Toolbar.Separator`
 * and `Toolbar.Spacer` (pushes what follows to the far end). A pressed state on an icon button (`pressed`) makes
 * it a toggle. Don't put a text field in a toolbar: it needs the arrow keys itself.
 *
 * @example
 * ```tsx
 * <Toolbar aria-label="Text formatting">
 *   <Toolbar.Group aria-label="Style">
 *     <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
 *     <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
 *   </Toolbar.Group>
 *   <Toolbar.Separator />
 *   <Toolbar.Button leadingIcon={LinkIcon}>Link</Toolbar.Button>
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
      wrap = false,
      fullWidth = false,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const resolvedOrientation = useResolvedResponsiveValue<ToolbarOrientation>(orientation, "horizontal");

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
    const toolbarSettings = useMemo(() => ({ disabled: Boolean(buttonSettings.disabled) }), [buttonSettings.disabled]);

    return (
      <ToolbarContext.Provider value={toolbarSettings}>
        <ButtonGroupProvider value={buttonSettings}>
          <ToolbarPrimitive.Root
            ref={ref}
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
            className={cx(
              styles.root,
              variant === "outlined" && styles.outlined,
              variant === "filled" && styles.filled,
              rounded && styles.rounded,
              wrap && styles.wrap,
              fullWidth && styles.fullWidth,
              className,
            )}
          >
            {children}
          </ToolbarPrimitive.Root>
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
 * An `IconButton` in the toolbar's arrow-key order. Takes every `IconButton` prop, including `pressed` for a
 * toggle; its `variant`, `size`, `rounded` and `disabled` default to the toolbar's.
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
 * Puts any one focusable element — a menu or popover trigger, a link, a `Button` wrapped in something — into the
 * toolbar's arrow-key order. It renders its only child, handing it the roving tab index and key handling.
 */
const ToolbarItem = forwardRef<HTMLElement, ToolbarItemProps>(({ children, disabled = false }, ref) => {
  const toolbar = useContext(ToolbarContext);
  return (
    <ToolbarPrimitive.Button asChild ref={ref as React.Ref<HTMLButtonElement>} disabled={disabled || toolbar.disabled}>
      {children}
    </ToolbarPrimitive.Button>
  );
});
ToolbarItem.displayName = "Toolbar.Item";

/** A named `role="group"` of related items inside the toolbar, laid out as one cluster. */
const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ children, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (!ariaLabel && !ariaLabelledBy && !hasWarnedNoAccessibleNameRef.current) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Toolbar.Group: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say what the group is for.",
        );
      }
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
  Separator: typeof ToolbarSeparator;
  Spacer: typeof ToolbarSpacer;
};

export const Toolbar: ToolbarComponent = Object.assign(ToolbarRoot, {
  Button: ToolbarButton,
  IconButton: ToolbarIconButton,
  Item: ToolbarItem,
  Group: ToolbarGroup,
  Separator: ToolbarSeparator,
  Spacer: ToolbarSpacer,
});
