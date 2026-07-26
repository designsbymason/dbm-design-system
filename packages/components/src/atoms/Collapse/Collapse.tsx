import { cx } from "@dbm-design-system/primitives";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { forwardRef } from "react";
import styles from "./Collapse.module.css";
import type { CollapseProps } from "./Collapse.types";

/**
 * A simple animated expand/collapse region built on Radix Collapsible —
 * the building block `Accordion` composes for each of its items. With
 * `trigger`, it's a self-contained disclosure; without it, `open` can be
 * driven entirely externally (what `Accordion` does with its own trigger
 * UI). `ref` forwards to the root element.
 *
 * @example
 * ```tsx
 * <Collapse trigger={<Button>Toggle details</Button>}>
 *   <Text>Hidden content revealed on toggle.</Text>
 * </Collapse>
 * <Collapse open={isOpen}>
 *   <Text>Driven by external state, no built-in trigger.</Text>
 * </Collapse>
 * ```
 */
export const Collapse = forwardRef<HTMLDivElement, CollapseProps>(
  (
    {
      open,
      defaultOpen,
      onOpenChange,
      disabled = false,
      trigger,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <CollapsiblePrimitive.Root
      ref={ref}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      className={cx(styles.root, className)}
      {...props}
    >
      {trigger && (
        <CollapsiblePrimitive.Trigger asChild>
          {trigger}
        </CollapsiblePrimitive.Trigger>
      )}
      <CollapsiblePrimitive.Content className={styles.content}>
        {children}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  ),
);

Collapse.displayName = "Collapse";
