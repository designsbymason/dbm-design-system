import { cx } from "@dbm-design-system/primitives";
import { createContext, forwardRef, useContext } from "react";
import { Heading } from "../../atoms/Heading";
import type { HeadingSize } from "../../atoms/Heading/Heading.types";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon/Icon.types";
import { Text } from "../../atoms/Text";
import type { TextSize } from "../../atoms/Text/Text.types";
import styles from "./EmptyState.module.css";
import type {
  EmptyStateActionsProps,
  EmptyStateDescriptionProps,
  EmptyStateIconProps,
  EmptyStateProps,
  EmptyStateSize,
  EmptyStateTitleProps,
  EmptyStateTone,
  EmptyStateVariant,
} from "./EmptyState.types";

// `ghost` has no class: it's the base styling (see EmptyState.module.css).
const variantClass: Record<EmptyStateVariant, string | undefined> = {
  ghost: undefined,
  outlined: styles.outlined,
  dashed: styles.dashed,
  filled: styles.filled,
};

const sizeClass: Record<EmptyStateSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// A tone's class only sets the icon badge's tint and icon colour; `neutral` has none.
const toneClass: Record<EmptyStateTone, string | undefined> = {
  neutral: undefined,
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

// The atoms the parts render take their own size props (font size, icon size),
// which a stylesheet can't reach, so the root passes its `size` down through a
// small context. The default is what a part used outside a root would get.
const EmptyStateSizeContext = createContext<EmptyStateSize>("md");

const iconSize: Record<EmptyStateSize, IconSize> = {
  xs: "sm",
  sm: "md",
  md: "lg",
  lg: "xl",
  xl: "2xl",
};

const titleSize: Record<EmptyStateSize, HeadingSize> = {
  xs: "base",
  sm: "md",
  md: "lg",
  lg: "xl",
  xl: "2xl",
};

const descriptionSize: Record<EmptyStateSize, TextSize> = {
  xs: "sm",
  sm: "sm",
  md: "base",
  lg: "base",
  xl: "md",
};

/**
 * What a page, a panel, or a list shows when there is nothing to show yet — no
 * data, no search results, nothing left to do, or something that went wrong. It
 * says what's empty and, ideally, offers the next step. A compound component,
 * meaning it's made of named sub-parts you compose together:
 * `EmptyState.Icon` (an icon in a round badge), `EmptyState.Title`,
 * `EmptyState.Description`, and `EmptyState.Actions`, in reading order, any of
 * them optional.
 *
 * `size` sets the padding, the spacing, and the size of the icon and text on the
 * standard xs–xl scale — small for a table cell or a narrow panel, large for a
 * page. `variant` picks the surface (`ghost` for none, `outlined`, `dashed`,
 * `filled`), `tone` tints the icon badge (so "nothing here yet" and "something
 * went wrong" share a layout), and `align` centres the content or sets it flush
 * with the start edge.
 *
 * An empty state is static content and adds no role. When it appears in response
 * to something the user did — a search that returns nothing — pass
 * `role="status"` so a screen reader announces it.
 *
 * `ref` forwards to the root `<div>`.
 *
 * @example
 * ```tsx
 * import { TrayIcon } from "@dbm-design-system/icons";
 *
 * <EmptyState>
 *   <EmptyState.Icon icon={TrayIcon} />
 *   <EmptyState.Title>No invoices yet</EmptyState.Title>
 *   <EmptyState.Description>
 *     Invoices you create will show up here.
 *   </EmptyState.Description>
 *   <EmptyState.Actions>
 *     <Button>Create invoice</Button>
 *   </EmptyState.Actions>
 * </EmptyState>
 *
 * <EmptyState role="status" size="sm" variant="dashed">
 *   <EmptyState.Title>No results for “fjord”</EmptyState.Title>
 *   <EmptyState.Description>Try a different search term.</EmptyState.Description>
 * </EmptyState>
 * ```
 */
const EmptyStateRoot = forwardRef<HTMLDivElement, EmptyStateProps>((emptyStateProps, ref) => {
  const {
    children,
    variant = "ghost",
    tone = "neutral",
    size = "md",
    align = "center",
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = emptyStateProps;

  return (
    <EmptyStateSizeContext.Provider value={size}>
      <div
        {...rest}
        ref={ref}
        id={id}
        style={style}
        data-testid={dataTestId}
        className={cx(
          styles.root,
          variantClass[variant],
          sizeClass[size],
          align === "start" && styles.alignStart,
          toneClass[tone],
          className,
        )}
      >
        {children}
      </div>
    </EmptyStateSizeContext.Provider>
  );
});
EmptyStateRoot.displayName = "EmptyState";

/** The icon, in a round badge tinted by the empty state's `tone`. Decorative unless given a `label`. */
const EmptyStateIcon = forwardRef<HTMLDivElement, EmptyStateIconProps>(
  ({ icon, label, className, ...props }, ref) => {
    const size = useContext(EmptyStateSizeContext);
    return (
      <div {...props} ref={ref} className={cx(styles.iconBadge, className)}>
        <Icon icon={icon} size={iconSize[size]} label={label} />
      </div>
    );
  },
);
EmptyStateIcon.displayName = "EmptyState.Icon";

/** The title — a real heading (`<h3>` unless `level` says otherwise), sized to the empty state's `size`. */
const EmptyStateTitle = forwardRef<HTMLHeadingElement, EmptyStateTitleProps>(
  ({ level = 3, className, ...props }, ref) => {
    const size = useContext(EmptyStateSizeContext);
    return (
      <Heading
        {...props}
        ref={ref}
        level={level}
        size={titleSize[size]}
        weight="semibold"
        className={cx(styles.title, className)}
      />
    );
  },
);
EmptyStateTitle.displayName = "EmptyState.Title";

/** The supporting text, in the secondary text colour and held to a comfortable line length. */
const EmptyStateDescription = forwardRef<HTMLParagraphElement, EmptyStateDescriptionProps>(
  ({ className, ...props }, ref) => {
    const size = useContext(EmptyStateSizeContext);
    return (
      <Text
        {...props}
        ref={ref}
        size={descriptionSize[size]}
        color="secondary"
        className={cx(styles.description, className)}
      />
    );
  },
);
EmptyStateDescription.displayName = "EmptyState.Description";

/** The next step — buttons or links in a row that wraps on a narrow screen, aligned with the rest of the content. */
const EmptyStateActions = forwardRef<HTMLDivElement, EmptyStateActionsProps>(
  ({ className, ...props }, ref) => (
    <div {...props} ref={ref} className={cx(styles.actions, className)} />
  ),
);
EmptyStateActions.displayName = "EmptyState.Actions";

type EmptyStateComponent = typeof EmptyStateRoot & {
  Icon: typeof EmptyStateIcon;
  Title: typeof EmptyStateTitle;
  Description: typeof EmptyStateDescription;
  Actions: typeof EmptyStateActions;
};

export const EmptyState: EmptyStateComponent = Object.assign(EmptyStateRoot, {
  Icon: EmptyStateIcon,
  Title: EmptyStateTitle,
  Description: EmptyStateDescription,
  Actions: EmptyStateActions,
});
