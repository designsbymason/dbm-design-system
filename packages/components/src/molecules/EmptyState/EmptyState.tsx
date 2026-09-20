import { cx, mergeRefs } from "@dbm-design-system/primitives";
import { createContext, forwardRef, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Heading } from "../../atoms/Heading";
import type { HeadingSize } from "../../atoms/Heading/Heading.types";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon/Icon.types";
import { Text } from "../../atoms/Text";
import type { TextSize } from "../../atoms/Text/Text.types";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./EmptyState.module.css";
import type {
  EmptyStateActionsProps,
  EmptyStateDescriptionProps,
  EmptyStateIconProps,
  EmptyStateMediaProps,
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

// `announce` fills a visually hidden live region a moment after it mounts, then
// clears it again. A live region announces a *change* to its content, not content
// that arrives with it, so the region has to be in the page — and known to the
// screen reader — before it is filled; the short delay is that gap. Clearing it
// afterwards stops the same text being read a second time in browse mode. Both are
// timings for assistive technology, not design values.
const ANNOUNCE_DELAY_MS = 100;
const ANNOUNCE_CLEAR_MS = 1000;

// A title or description that already ends a sentence needs no full stop added, in
// whatever script: Latin, full-width (CJK), Arabic, and Devanagari terminators.
const endsAsSentence = /[.!?…。！？؟۔।]$/;

/**
 * What a page, a panel, or a list shows when there is nothing to show yet — no
 * data, no search results, nothing left to do, or something that went wrong. It
 * says what's empty and, ideally, offers the next step. A compound component,
 * meaning it's made of named sub-parts you compose together:
 * `EmptyState.Media` (an illustration), `EmptyState.Icon` (an icon in a round
 * badge), `EmptyState.Title`, `EmptyState.Description`, and `EmptyState.Actions`,
 * in reading order, any of them optional.
 *
 * `size` sets the padding, the spacing, and the size of the icon and text on the
 * standard xs–xl scale — small for a table cell or a narrow panel, large for a
 * page. `variant` picks the surface (`ghost` for none, `outlined`, `dashed`,
 * `filled`), `tone` tints the icon badge (so "nothing here yet" and "something
 * went wrong" share a layout), and `align` centres the content or sets it flush
 * with the start edge.
 *
 * An empty state is static content and adds no role. When it appears in response
 * to something the user did — a search that returns nothing — set `announce` so a
 * screen reader is told about it.
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
 * <EmptyState announce size="sm" variant="dashed">
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
    announce = false,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = emptyStateProps;

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
  const [announcement, setAnnouncement] = useState("");
  const announced = useRef("");
  const timers = useRef<{ show?: number; clear?: number }>({});

  // Read the title and description straight from the rendered DOM, so any content
  // they hold (not only a string) is announced as it reads. Runs after every
  // render but only acts when that text is new. `setAnnouncement` is only ever
  // called from the timers below, never synchronously from this effect.
  useEffect(() => {
    if (!announce) {
      announced.current = "";
      return;
    }
    // Only this empty state's own parts — not those of one nested inside it.
    const root = rootRef.current;
    const parts = [...(root?.querySelectorAll(`.${styles.title}, .${styles.description}`) ?? [])]
      .filter((element) => element.closest(`.${styles.root}`) === root)
      .map((element) => element.textContent?.trim() ?? "")
      .filter(Boolean)
      .map((text) => (endsAsSentence.test(text) ? text : `${text}.`));
    const text = parts.join(" ");
    if (!text || text === announced.current) return;
    announced.current = text;
    window.clearTimeout(timers.current.show);
    window.clearTimeout(timers.current.clear);
    timers.current.show = window.setTimeout(() => {
      setAnnouncement(text);
      timers.current.clear = window.setTimeout(() => setAnnouncement(""), ANNOUNCE_CLEAR_MS);
    }, ANNOUNCE_DELAY_MS);
  });

  // On unmount, cancel the timers and forget what was announced. Forgetting matters
  // beyond tidiness: React's StrictMode (development) mounts, unmounts, and remounts
  // a component, keeping its refs — so a remembered text would make the remount think
  // it had already announced, and nothing would ever be announced.
  useEffect(
    () => () => {
      window.clearTimeout(timers.current.show);
      window.clearTimeout(timers.current.clear);
      announced.current = "";
    },
    [],
  );

  // `announce` already provides a status region; a `status` role on the root too
  // would announce everything twice.
  const { role } = rest;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && announce && role === "status") {
      console.warn(
        "EmptyState: `announce` already renders a status region, so also setting `role=\"status\"` on the root announces the message twice. Remove `role`, or remove `announce`.",
      );
    }
  }, [announce, role]);

  return (
    <EmptyStateSizeContext.Provider value={size}>
      <div
        {...rest}
        ref={mergedRef}
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
        {announce && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
      </div>
    </EmptyStateSizeContext.Provider>
  );
});
EmptyStateRoot.displayName = "EmptyState";

/** An illustration, kept within the empty state and the size step's cap — a larger image is scaled down, a smaller one keeps its size. */
const EmptyStateMedia = forwardRef<HTMLDivElement, EmptyStateMediaProps>(
  ({ className, ...props }, ref) => (
    <div {...props} ref={ref} className={cx(styles.media, className)} />
  ),
);
EmptyStateMedia.displayName = "EmptyState.Media";

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

/** The next step — buttons or links in a row that wraps on a narrow screen (or, with `stackOnMobile`, a full-width column on a phone), aligned with the rest of the content. */
const EmptyStateActions = forwardRef<HTMLDivElement, EmptyStateActionsProps>(
  ({ stackOnMobile = false, className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cx(styles.actions, stackOnMobile && styles.actionsStack, className)}
    />
  ),
);
EmptyStateActions.displayName = "EmptyState.Actions";

type EmptyStateComponent = typeof EmptyStateRoot & {
  Media: typeof EmptyStateMedia;
  Icon: typeof EmptyStateIcon;
  Title: typeof EmptyStateTitle;
  Description: typeof EmptyStateDescription;
  Actions: typeof EmptyStateActions;
};

export const EmptyState: EmptyStateComponent = Object.assign(EmptyStateRoot, {
  Media: EmptyStateMedia,
  Icon: EmptyStateIcon,
  Title: EmptyStateTitle,
  Description: EmptyStateDescription,
  Actions: EmptyStateActions,
});
