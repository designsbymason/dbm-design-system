import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Code.module.css";
import type { CodeProps } from "./Code.types";

/**
 * A short, inline monospace code snippet — a single word, identifier, or
 * short expression within a line of text. For multi-line, syntax-
 * highlighted code with a copy button, use `CodeBlock` instead.
 *
 * @example
 * ```tsx
 * <Text>Run <Code>pnpm install</Code> to get started.</Text>
 * ```
 */
export const Code = forwardRef<HTMLElement, CodeProps>(
  ({ className, ...props }, ref) => (
    <code ref={ref} className={cx(styles.root, className)} {...props} />
  ),
);

Code.displayName = "Code";
