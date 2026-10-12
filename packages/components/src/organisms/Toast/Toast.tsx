import {
  CheckCircleIcon,
  InfoIcon,
  NoteIcon,
  WarningIcon,
  WarningOctagonIcon,
  XIcon,
} from "@dbm-design-system/icons";
import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, mergeRefs, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import * as ToastPrimitive from "@radix-ui/react-toast";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { FocusEvent, ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import type { IconSize, IconTone } from "../../atoms/Icon";
import { Portal } from "../../atoms/Portal";
import { Spinner } from "../../atoms/Spinner";
import type { SpinnerSize } from "../../atoms/Spinner";
import { OverlayLifecycle } from "../../internal/overlay/OverlayLifecycle";
import styles from "./Toast.module.css";
import type {
  ToastActionOptions,
  ToastActionProps,
  ToastActionVariant,
  ToastApi,
  ToastDescriptionProps,
  ToastLabels,
  ToastOpenChangeReason,
  ToastOptions,
  ToastPlacement,
  ToastPromiseOptions,
  ToastProps,
  ToastProviderProps,
  ToastRole,
  ToastSize,
  ToastTitleProps,
  ToastTone,
  ToastVariant,
} from "./Toast.types";
import { ToastStore } from "./ToastStore";
import type { ToastEntry } from "./ToastStore";

const toneClass: Record<ToastTone, string | undefined> = {
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
  neutral: styles.toneNeutral,
};

const variantClass: Record<ToastVariant, string | undefined> = {
  subtle: styles.variantSubtle,
  outlined: styles.variantOutlined,
  solid: styles.variantSolid,
};

const sizeClass: Record<ToastSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const actionVariantClass: Record<ToastActionVariant, string | undefined> = {
  primary: styles.actionPrimary,
  secondary: styles.actionSecondary,
  tertiary: styles.actionTertiary,
};

// The icons of the tone scale. `Alert` keeps the same five; this is the second consumer, and the rule is to extract a
// shared module at the third (`05-component-api-conventions.md` §1).
const toneIcon: Record<ToastTone, PhosphorIcon> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: WarningIcon,
  danger: WarningOctagonIcon,
  neutral: NoteIcon,
};

// The icon colour: the tone's own on a light or tinted background, the "on" colour on a solid fill.
const iconTone: Record<ToastTone, IconTone> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "default",
};
const solidIconTone: Record<ToastTone, IconTone> = {
  info: "on-info",
  success: "on-success",
  warning: "on-warning",
  danger: "on-danger",
  neutral: "on-neutral",
};

const iconSizeForSize: Record<ToastSize, IconSize> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };
const spinnerSizeForSize: Record<ToastSize, SpinnerSize> = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" };
const dismissIconSizeForSize: Record<ToastSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

// A toast that needs attention now interrupts; one that is only news waits for a pause.
const defaultRole: Record<ToastTone, ToastRole> = {
  info: "status",
  success: "status",
  warning: "alert",
  danger: "alert",
  neutral: "status",
};

const defaultLabels: ToastLabels = {
  dismiss: "Dismiss",
  viewport: "Notifications ({hotkey})",
  notification: "Notification",
};

const DEFAULT_LIMIT = 3;
const DEFAULT_DURATION = 5000;
const DEFAULT_PLACEMENT: ToastPlacement = "bottom-end";

/** What a toast reads from the provider around it. */
interface ToastSystemValue {
  store: ToastStore;
  variant: ToastVariant;
  size: ToastSize;
  labels: ToastLabels;
  api: ToastApi;
  /** The way a swipe closes a toast, which the provider tells Radix and each toast writes back (see `ToastRoot`). */
  swipeDirection: "up" | "down" | "left" | "right";
}
const ToastSystemContext = createContext<ToastSystemValue | null>(null);

/** What a toast's own parts read from it: the colours they draw with, the size, and a way to say why it closed. */
interface ToastItemValue {
  variant: ToastVariant;
  size: ToastSize;
  markReason: (reason: ToastOpenChangeReason) => void;
}
const ToastItemContext = createContext<ToastItemValue | null>(null);

// `toast.promise` and friends do nothing outside a provider; `useToast()` warns about it once.
const noop = () => undefined;
const noopToast = Object.assign(() => "", {
  promise: <Value,>(promise: Promise<Value>) => promise,
});
const noopApi: ToastApi = { toast: noopToast, update: noop, dismiss: noop, dismissAll: noop };

function normalise(options: string | ToastOptions): ToastOptions {
  return typeof options === "string" ? { title: options } : options;
}

function createApi(store: ToastStore): ToastApi {
  const toast = Object.assign((options: string | ToastOptions) => store.add(normalise(options)), {
    promise: <Value,>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => {
      const loading = normalise(options.loading);
      const id = store.add({
        tone: "neutral",
        duration: null,
        ...loading,
        id: options.id ?? loading.id,
        loading: true,
      });
      void promise.then(
        (value) => {
          const next = typeof options.success === "function" ? options.success(value) : options.success;
          store.add({ tone: "success", ...normalise(next), id, loading: false });
        },
        (reason: unknown) => {
          const next = typeof options.error === "function" ? options.error(reason) : options.error;
          store.add({ tone: "danger", ...normalise(next), id, loading: false });
        },
      );
      return promise;
    },
  });
  return {
    toast,
    update: (id, options) => store.update(id, options),
    dismiss: (id) => {
      store.close(id, "programmatic");
    },
    dismissAll: () => store.closeAll(),
  };
}

/**
 * Raises and manages toasts from code. Must be used inside a `Toast.Provider`; outside one it warns in development
 * and does nothing.
 *
 * @example
 * ```tsx
 * const { toast } = useToast();
 * toast({ tone: "success", title: "Saved", action: { label: "Undo", altText: "Undo from the Edit menu", onClick: undo } });
 * ```
 */
export function useToast(): ToastApi {
  const system = useContext(ToastSystemContext);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !system) {
      console.warn("useToast: no `Toast.Provider` above this component, so toasts raised from it show nothing. Wrap the app in one.");
    }
  }, [system]);
  return system?.api ?? noopApi;
}

/** The headline of the message, in a few words. */
const ToastTitle = forwardRef<HTMLDivElement, ToastTitleProps>(({ className, children, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.title, className)}>
    {children}
  </div>
));
ToastTitle.displayName = "Toast.Title";

/** The message itself — text, or anything a message can hold, such as a link. */
const ToastDescription = forwardRef<HTMLDivElement, ToastDescriptionProps>(({ className, children, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.description, className)}>
    {children}
  </div>
));
ToastDescription.displayName = "Toast.Description";

/**
 * One thing the person can do about the message — a `Button` that takes its colours (and its size) from the toast
 * around it, so it reads against any tone and variant. Pressing it closes the toast after its own `onClick` has run.
 * `altText` is required: a toast goes away by itself, so say how to do the same thing without it.
 */
const ToastAction = forwardRef<HTMLButtonElement, ToastActionProps>(
  ({ variant = "primary", altText, className, onClickCapture, ...props }, ref) => {
    const item = useContext(ToastItemContext);
    const known = variant in actionVariantClass;
    const resolved: ToastActionVariant = known ? variant : "primary";
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && !known) {
        console.warn(
          `Toast.Action: \`variant\` must be "primary", "secondary" or "tertiary", but got ${JSON.stringify(variant)} — it is treated as "primary".`,
        );
      }
    }, [known, variant]);
    return (
      <ToastPrimitive.Action asChild altText={altText}>
        <Button
          {...props}
          ref={ref}
          // After `...props`: the size is the toast's, and the variant is one of ours, whatever a caller passes.
          variant={resolved}
          size={item?.size ?? "md"}
          className={cx(styles.action, actionVariantClass[resolved], className)}
          onClickCapture={(event) => {
            item?.markReason("action");
            onClickCapture?.(event);
          }}
        />
      </ToastPrimitive.Action>
    );
  },
);
ToastAction.displayName = "Toast.Action";

/**
 * One toast, drawn as parts: `Toast.Title`, `Toast.Description` and `Toast.Action` in any order. Use it inside a
 * `Toast.Provider` for a message that belongs to your own state; for one raised from an event or a request, call
 * `toast()` from `useToast()`, which draws the same thing from data.
 *
 * It is a non-blocking, transient message: it never takes focus, closes by itself after `duration` (paused while the
 * pointer is over it or focus is inside it), and can be swiped toward the screen edge or dismissed with Escape. It is
 * announced as a live region, following the tone (`"alert"` for `danger` and `warning`, `"status"` otherwise).
 *
 * @example
 * ```tsx
 * <Toast.Provider>
 *   <Toast tone="success" open={saved} onOpenChange={(open) => setSaved(open)}>
 *     <Toast.Title>Saved</Toast.Title>
 *     <Toast.Description>Your changes are live.</Toast.Description>
 *   </Toast>
 * </Toast.Provider>
 * ```
 */
const ToastRoot = forwardRef<HTMLLIElement, ToastProps>(
  (
    {
      children,
      tone = "info",
      variant: variantProp,
      size: sizeProp,
      icon,
      loading = false,
      dismissible = true,
      duration: durationProp,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      onOpenChangeComplete,
      role,
      dismissLabel,
      className,
      ...props
    },
    ref,
  ) => {
    const system = useContext(ToastSystemContext);
    const variant = variantProp ?? system?.variant ?? "subtle";
    const size = sizeProp ?? system?.size ?? "md";
    const labels = system?.labels ?? defaultLabels;

    const isControlled = openProp !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = isControlled ? openProp : uncontrolledOpen;
    const panelRef = useRef<HTMLLIElement | null>(null);
    const reason = useRef<ToastOpenChangeReason | null>(null);

    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && isControlled && defaultOpen === false) {
        console.warn("Toast: both `open` and `defaultOpen` were given. `open` makes it controlled, so `defaultOpen` is ignored — remove one.");
      }
    }, [isControlled, defaultOpen]);

    const markReason = useCallback((next: ToastOpenChangeReason) => {
      reason.current = next;
    }, []);
    const contextValue = useMemo<ToastItemValue>(() => ({ variant, size, markReason }), [variant, size, markReason]);

    // What Radix reports is only that it closed; the reason was written down by whatever caused it, and a close nothing
    // marked is the timer.
    const handleOpenChange = (next: boolean) => {
      const why = reason.current ?? "timeout";
      reason.current = null;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next, { reason: why });
    };

    const resolvedRole = role ?? (loading ? "status" : defaultRole[tone]);
    const glyph = icon === false ? undefined : (icon ?? toneIcon[tone]);
    const iconColour = variant === "solid" ? solidIconTone[tone] : iconTone[tone];
    let leading: ReactNode = null;
    if (loading) leading = <Spinner size={spinnerSizeForSize[size]} tone={iconColour} />;
    else if (glyph) leading = <Icon icon={glyph} size={iconSizeForSize[size]} tone={iconColour} />;

    // `null` means "until dismissed", which Radix spells `Infinity`; a number is its own, and left out the provider's.
    const duration = durationProp === null ? Infinity : durationProp;

    return (
      <ToastPrimitive.Root
        {...props}
        ref={mergeRefs(ref, panelRef)}
        type={resolvedRole === "alert" ? "foreground" : "background"}
        duration={duration}
        open={open}
        onOpenChange={handleOpenChange}
        onEscapeKeyDown={() => markReason("escape")}
        onSwipeEnd={() => markReason("swipe")}
        // After `...props`, and again here, since Radix writes these itself *before* it spreads the props it is given: a
        // same-named prop would otherwise win, and a `data-state` of the caller's would stop the exit from ever ending.
        data-state={open ? "open" : "closed"}
        data-swipe-direction={system?.swipeDirection ?? "right"}
        tabIndex={0}
        className={cx(styles.root, toneClass[tone], variantClass[variant], sizeClass[size], className)}
      >
        <ToastItemContext.Provider value={contextValue}>
          {leading && <span className={styles.icon}>{leading}</span>}
          <div className={styles.body}>{children}</div>
          {dismissible && (
            <ToastPrimitive.Close asChild>
              <button
                type="button"
                className={styles.dismiss}
                aria-label={dismissLabel ?? labels.dismiss}
                onClickCapture={() => markReason("dismiss")}
              >
                <Icon icon={XIcon} size={dismissIconSizeForSize[size]} />
              </button>
            </ToastPrimitive.Close>
          )}
        </ToastItemContext.Provider>
        <OverlayLifecycle open={open} panelRef={panelRef} onOpenChangeComplete={onOpenChangeComplete} />
      </ToastPrimitive.Root>
    );
  },
);
ToastRoot.displayName = "Toast";

/** A toast the provider holds, drawn from its options. */
function ToastEntryView({ entry }: { entry: ToastEntry }) {
  const system = useContext(ToastSystemContext);
  const store = system?.store;
  const { id, options, open } = entry;
  const shown = useRef(false);
  const told = useRef(false);
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const handleOpenChange = (next: boolean, details: { reason: ToastOpenChangeReason }) => {
    if (next || !store) return;
    told.current = true;
    store.close(id, details.reason);
    store.takeReason(id);
    latest.current.onOpenChange?.(false, details);
  };

  // A close the person didn't cause (`dismiss()`, `dismissAll()`, a replacement from the provider) is reported here,
  // once the toast's own state has changed.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) {
      if (!told.current) latest.current.onOpenChange?.(false, { reason: store?.takeReason(id) ?? "programmatic" });
    }
    if (open) told.current = false;
    wasOpen.current = open;
  }, [open, id, store]);

  // A toast that was closed before it was ever drawn has no exit to wait for.
  useEffect(() => {
    if (!open && !shown.current) store?.remove(id);
  }, [open, id, store]);

  const action: ToastActionOptions | undefined = options.action;
  return (
    <ToastRoot
      ref={(node) => {
        if (node) shown.current = true;
      }}
      tone={options.tone}
      variant={options.variant}
      size={options.size}
      icon={options.icon}
      loading={options.loading}
      dismissible={options.dismissible}
      duration={options.duration === undefined && options.loading ? null : options.duration}
      role={options.role}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(next) => {
        latest.current.onOpenChangeComplete?.(next);
        if (!next) store?.remove(id);
      }}
    >
      {options.title !== undefined && <ToastTitle>{options.title}</ToastTitle>}
      {options.description !== undefined && <ToastDescription>{options.description}</ToastDescription>}
      {action && (
        <ToastAction altText={action.altText} variant={action.variant} onClick={action.onClick}>
          {action.label}
        </ToastAction>
      )}
    </ToastRoot>
  );
}

// The way a swipe closes a toast: toward the edge it sits against. Radix's directions are physical.
function swipeDirectionFor(placement: ToastPlacement, dir: "ltr" | "rtl"): "up" | "down" | "left" | "right" {
  if (placement === "top") return "up";
  if (placement === "bottom") return "down";
  const towardEnd = placement.endsWith("-end");
  return towardEnd === (dir === "ltr") ? "right" : "left";
}

/**
 * Holds the toasts and draws their region: place it once, near the root of the app, around everything that may raise a
 * toast. Children use `useToast()` to raise them, or draw a `Toast` of their own.
 *
 * The region is a landmark at the end of the page, named "Notifications (F8)" (the key moves focus into it). It is
 * drawn in the page's body (or `container`), above dialogs, so it is never clipped or stacked under the app.
 *
 * @example
 * ```tsx
 * <Toast.Provider placement="bottom-end" limit={3}>
 *   <App />
 * </Toast.Provider>
 * ```
 */
const ToastProvider = forwardRef<HTMLOListElement, ToastProviderProps>(
  (
    {
      children,
      placement = DEFAULT_PLACEMENT,
      limit = DEFAULT_LIMIT,
      duration = DEFAULT_DURATION,
      size = "md",
      variant = "subtle",
      hotkey,
      dir = "ltr",
      container,
      labels: labelOverrides,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [store] = useState(() => new ToastStore());

    const entries = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
    const showing = Math.max(1, Math.floor(limit));
    const visible = entries.slice(0, showing);
    // The store is told how many are on screen, for `dismissAll()` to know which are showing and which are waiting.
    useEffect(() => {
      store.setShowing(showing);
    }, [store, showing]);

    const api = useMemo(() => createApi(store), [store]);
    const labels: ToastLabels = mergeDefined(defaultLabels, labelOverrides);
    const resolvedPlacement = useResolvedResponsiveValue<ToastPlacement>(placement, DEFAULT_PLACEMENT);
    const swipeDirection = swipeDirectionFor(resolvedPlacement, dir);
    const value = useMemo<ToastSystemValue>(
      () => ({ store, variant, size, labels, api, swipeDirection }),
      // `labels` is rebuilt every render; its pieces are what matter.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [store, variant, size, labels.dismiss, labels.viewport, labels.notification, api, swipeDirection],
    );

    // Focus. A toast never takes it, but a person can move into the region (the hotkey, Tab) and press its action;
    // when the toasts are gone by then, focus goes back to where they came from rather than dropping to the top of the
    // page. Worked out while focus is still there, since by the time it is gone there is nothing to ask.
    const viewportRef = useRef<HTMLOListElement | null>(null);
    const focusWithin = useRef(false);
    const returnTarget = useRef<HTMLElement | null>(null);
    const handleFocus = (event: FocusEvent<HTMLOListElement>) => {
      const from = event.relatedTarget;
      if (!focusWithin.current && from instanceof HTMLElement && from !== document.body && !event.currentTarget.contains(from)) {
        returnTarget.current = from;
      }
      focusWithin.current = true;
      onFocus?.(event);
    };
    const handleBlur = (event: FocusEvent<HTMLOListElement>) => {
      // Focus moving somewhere outside. Focus leaving because the element was removed has no `relatedTarget`.
      if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
        focusWithin.current = false;
      }
      onBlur?.(event);
    };
    const empty = entries.length === 0;
    useEffect(() => {
      if (!empty || !focusWithin.current) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== viewportRef.current) return;
      focusWithin.current = false;
      const target = returnTarget.current;
      returnTarget.current = null;
      if (target?.isConnected) target.focus();
    }, [empty]);

    return (
      <ToastSystemContext.Provider value={value}>
        <ToastPrimitive.Provider
          label={labels.notification}
          duration={duration === null ? Infinity : duration}
          swipeDirection={swipeDirection}
        >
          {children}
          {visible.map((entry) => (
            <ToastEntryView key={entry.id} entry={entry} />
          ))}
          <Portal container={container}>
            <ToastPrimitive.Viewport
              {...props}
              ref={mergeRefs(ref, viewportRef)}
              label={labels.viewport}
              hotkey={hotkey}
              // After `...props`: the direction and the placement are the ones in effect, whatever a caller passes.
              dir={dir}
              data-placement={resolvedPlacement}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={cx(styles.viewport, className)}
            />
          </Portal>
        </ToastPrimitive.Provider>
      </ToastSystemContext.Provider>
    );
  },
);
ToastProvider.displayName = "Toast.Provider";

type ToastComponent = typeof ToastRoot & {
  Provider: typeof ToastProvider;
  Title: typeof ToastTitle;
  Description: typeof ToastDescription;
  Action: typeof ToastAction;
};

export const Toast: ToastComponent = Object.assign(ToastRoot, {
  Provider: ToastProvider,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
});
