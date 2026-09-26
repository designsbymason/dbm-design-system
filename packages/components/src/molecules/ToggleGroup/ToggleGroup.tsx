import { cx, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { createContext, forwardRef, useContext, useMemo, useRef, useState } from "react";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon";
import styles from "./ToggleGroup.module.css";
import type {
  ToggleGroupItemProps,
  ToggleGroupOrientation,
  ToggleGroupProps,
  ToggleGroupSize,
  ToggleGroupVariant,
} from "./ToggleGroup.types";

const sizeClass: Record<ToggleGroupSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const variantClass: Record<ToggleGroupVariant, string | undefined> = {
  subtle: styles.variantSubtle,
  outlined: styles.variantOutlined,
  solid: styles.variantSolid,
};

// The same icon step `Tabs.Trigger` and `Button` use for each size.
const iconSizeForSize: Record<ToggleGroupSize, IconSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
};

interface ToggleGroupContextValue {
  variant: ToggleGroupVariant;
  size: ToggleGroupSize;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>({ variant: "outlined", size: "md" });

/**
 * A set of toggle buttons where the chosen ones are marked: a segmented control (`type="single"`, the default: at most
 * one item is chosen, and once there is one it stays, unless `deselectable`) or a set of independent toggles
 * (`type="multiple"`). Built on Radix ToggleGroup, so the group is a single tab stop and the arrow keys move between
 * its items (`Home` and `End` jump to the ends; `loop` wraps them), and `Space` or `Enter` chooses one. A single group is
 * a named `role="radiogroup"` of `role="radio"` items (`aria-checked`); a multiple one is a named `role="toolbar"` of
 * buttons (`aria-pressed`) — Radix's own choices, each the pattern that matches its behaviour.
 *
 * Compound: `ToggleGroup.Item` is one choice. `variant`, `size`, `rounded`, `attached`, `orientation`, `fullWidth` and
 * `disabled` belong to the group and reach every item. Not a set of ordinary buttons — for that, use `ButtonGroup`.
 *
 * @example
 * ```tsx
 * <ToggleGroup aria-label="Text alignment" defaultValue="left">
 *   <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
 *   <ToggleGroup.Item value="center">Centre</ToggleGroup.Item>
 *   <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
 * </ToggleGroup>
 * <ToggleGroup aria-label="Text style" type="multiple" variant="solid" size="sm">
 *   <ToggleGroup.Item value="bold" icon={TextBIcon} aria-label="Bold" />
 *   <ToggleGroup.Item value="italic" icon={TextItalicIcon} aria-label="Italic" />
 * </ToggleGroup>
 * <ToggleGroup aria-label="Range" value={range} onValueChange={setRange} attached={false}>…</ToggleGroup>
 * ```
 */
const ToggleGroupRoot = forwardRef<HTMLDivElement, ToggleGroupProps>((props, ref) => {
  const {
    type = "single",
    value,
    defaultValue,
    onValueChange,
    deselectable = false,
    variant = "outlined",
    size = "md",
    rounded = false,
    attached = true,
    orientation = "horizontal",
    fullWidth = false,
    disabled = false,
    loop = true,
    dir = "ltr",
    className,
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...rest
  } = props;

  const resolvedOrientation = useResolvedResponsiveValue<ToggleGroupOrientation>(orientation, "horizontal");

  const hasWarnedNoAccessibleNameRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    if (!ariaLabel && !ariaLabelledBy && !hasWarnedNoAccessibleNameRef.current) {
      hasWarnedNoAccessibleNameRef.current = true;
      console.warn(
        "ToggleGroup: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say what the group of toggles is for.",
      );
    }
  }

  // A single group that keeps one item chosen (`deselectable` off) has to refuse the empty value Radix reports when the
  // chosen item is clicked again. Radix keeps its own state when uncontrolled, and ignoring its change would not stop
  // it clearing, so a single group is always controlled from here.
  const [uncontrolledSingle, setUncontrolledSingle] = useState(() => (typeof defaultValue === "string" ? defaultValue : ""));
  const isSingleControlled = typeof value === "string";
  const currentSingle = isSingleControlled ? value : uncontrolledSingle;
  const handleSingleChange = (next: string) => {
    if (next === "" && !deselectable) return;
    if (!isSingleControlled) setUncontrolledSingle(next);
    (onValueChange as ((next: string) => void) | undefined)?.(next);
  };

  const context = useMemo(() => ({ variant, size }), [variant, size]);

  const shared = {
    ...rest,
    ref,
    dir,
    loop,
    disabled,
    orientation: resolvedOrientation,
    // Applied after `...rest` so a same-named consumer prop can never replace them (05-component-api-conventions.md
    // §3): the role is what tells assistive tech which pattern this is, and the orientation drives the layout.
    role: type === "multiple" ? "toolbar" : "radiogroup",
    "data-orientation": resolvedOrientation,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className: cx(
      styles.root,
      attached ? styles.attached : styles.spaced,
      rounded && styles.rounded,
      fullWidth && styles.fullWidth,
      className,
    ),
  };

  return (
    <ToggleGroupContext.Provider value={context}>
      {type === "multiple" ? (
        <ToggleGroupPrimitive.Root
          {...shared}
          type="multiple"
          value={value as string[] | undefined}
          defaultValue={defaultValue as string[] | undefined}
          onValueChange={onValueChange as ((next: string[]) => void) | undefined}
        >
          {children}
        </ToggleGroupPrimitive.Root>
      ) : (
        <ToggleGroupPrimitive.Root {...shared} type="single" value={currentSingle} onValueChange={handleSingleChange}>
          {children}
        </ToggleGroupPrimitive.Root>
      )}
    </ToggleGroupContext.Provider>
  );
});
ToggleGroupRoot.displayName = "ToggleGroup";

/**
 * One choice in a `ToggleGroup`. A real `<button>`: chosen by a click, or `Space` / `Enter` when it has focus, and marked
 * `data-state="on"` while chosen. An icon-only item (no children) needs an `aria-label`.
 */
const ToggleGroupItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>((itemProps, ref) => {
  const { value, icon, asChild = false, className, children, ...props } = itemProps;
  const { variant, size } = useContext(ToggleGroupContext);

  const hasWarnedIconRef = useRef(false);
  const hasWarnedNameRef = useRef(false);
  const hasLabel = children !== undefined && children !== null && children !== false;
  if (process.env.NODE_ENV !== "production") {
    if (asChild && icon !== undefined && !hasWarnedIconRef.current) {
      hasWarnedIconRef.current = true;
      console.warn(
        "ToggleGroup.Item: `icon` has no effect when `asChild` is set — the slotted child supplies its own content. Render the icon inside the child instead.",
      );
    }
    if (!asChild && !hasLabel && !props["aria-label"] && !props["aria-labelledby"] && !hasWarnedNameRef.current) {
      hasWarnedNameRef.current = true;
      console.warn(
        "ToggleGroup.Item: no accessible name — an icon-only item has no visible label to name it. Pass `aria-label` (or `aria-labelledby`), or give it children.",
      );
    }
  }

  return (
    <ToggleGroupPrimitive.Item
      {...props}
      ref={ref}
      value={value}
      asChild={asChild}
      className={cx(
        styles.item,
        sizeClass[size],
        variantClass[variant],
        !asChild && !hasLabel && styles.iconOnly,
        className,
      )}
    >
      {asChild ? (
        children
      ) : (
        <>
          {icon && <Icon icon={icon} size={iconSizeForSize[size]} className={styles.itemIcon} />}
          {hasLabel && <span className={styles.itemLabel}>{children}</span>}
        </>
      )}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = "ToggleGroup.Item";

type ToggleGroupComponent = typeof ToggleGroupRoot & {
  Item: typeof ToggleGroupItem;
};

export const ToggleGroup: ToggleGroupComponent = Object.assign(ToggleGroupRoot, {
  Item: ToggleGroupItem,
});
