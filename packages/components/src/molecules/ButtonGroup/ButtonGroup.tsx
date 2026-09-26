import { cx, useResolvedResponsiveValue } from "@dbm-design-system/primitives";
import { forwardRef, useMemo, useRef } from "react";
import { ButtonGroupProvider } from "../../atoms/Button/buttonGroupContext";
import styles from "./ButtonGroup.module.css";
import type { ButtonGroupOrientation, ButtonGroupProps } from "./ButtonGroup.types";

/**
 * A set of related buttons laid out as one: fused into a segmented control (`attached`, the default) or
 * spaced apart, in a row or a column. It is a `role="group"` with a name, and it hands its `variant`, `size`,
 * `rounded` and `disabled` to the `Button`s and `IconButton`s inside it as defaults — a button's own prop
 * still wins — so a group of five needs them said once.
 *
 * Every button stays an ordinary button: each is a tab stop and takes Enter and Space. A group is not a
 * selection control (no button is "chosen" — a toggle pressed state is each button's own) and does not
 * move focus with the arrow keys.
 *
 * @example
 * ```tsx
 * <ButtonGroup aria-label="Document actions" variant="secondary">
 *   <Button>Copy</Button>
 *   <Button>Paste</Button>
 *   <IconButton icon={TrashIcon} aria-label="Delete" />
 * </ButtonGroup>
 * <ButtonGroup aria-label="Zoom" attached={false} size="sm">…</ButtonGroup>
 * <ButtonGroup aria-label="Actions" orientation={{ base: "vertical", md: "horizontal" }} fullWidth>…</ButtonGroup>
 * ```
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      children,
      variant,
      size,
      rounded,
      disabled = false,
      attached = true,
      orientation = "horizontal",
      fullWidth = false,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const resolvedOrientation = useResolvedResponsiveValue<ButtonGroupOrientation>(
      orientation,
      "horizontal",
    );

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (!ariaLabel && !ariaLabelledBy && !hasWarnedNoAccessibleNameRef.current) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "ButtonGroup: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say what the group of buttons is for.",
        );
      }
    }

    const settings = useMemo(
      () => ({ variant, size, rounded, disabled }),
      [variant, size, rounded, disabled],
    );

    return (
      <ButtonGroupProvider value={settings}>
        <div
          ref={ref}
          {...props}
          // Applied after `{...props}` so a same-named consumer prop can never replace them
          // (05-component-api-conventions.md §3).
          role="group"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          data-orientation={resolvedOrientation}
          className={cx(
            styles.root,
            attached ? styles.attached : styles.spaced,
            fullWidth && styles.fullWidth,
            className,
          )}
        >
          {children}
        </div>
      </ButtonGroupProvider>
    );
  },
);

ButtonGroup.displayName = "ButtonGroup";
