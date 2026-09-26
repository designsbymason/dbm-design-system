import type { ComponentPropsWithoutRef, CSSProperties } from "react";

/**
 * The words `CodeBlock` writes itself, so they can be translated. The two that mention a count are functions
 * of it, since a language's plural rules (and word order) can't be built from a fixed string.
 */
export interface CodeBlockLabels {
  /**
   * The accessible name of the copy button.
   * @default 'Copy code'
   */
  copy: string;
  /**
   * Announced to screen readers once the code has been copied.
   * @default 'Copied'
   */
  copied: string;
  /**
   * Announced to screen readers when copying was blocked (the browser refused clipboard access).
   * @default 'Copy failed'
   */
  copyFailed: string;
  /**
   * The button that shows the rest of a collapsed block. Given the number of lines it will reveal.
   * @default (count) => `Show ${count} more lines`
   */
  expand: (hiddenLines: number) => string;
  /**
   * The button that collapses an expanded block again.
   * @default 'Show less'
   */
  collapse: string;
  /**
   * The name of the scrollable code region, used only when the block has no `title`, `aria-label` or
   * `aria-labelledby` to name it.
   * @default 'Code'
   */
  region: string;
}

export interface CodeBlockProps extends Omit<ComponentPropsWithoutRef<"figure">, "children" | "title"> {
  /**
   * The source text to show. Line endings are normalised, and one trailing newline is dropped (a template
   * literal's last character is not a line). It is drawn as text, never as HTML, and it is exactly what the
   * copy button copies.
   */
  code: string;
  /**
   * The language to highlight it as: `ts`, `tsx`, `js`, `jsx`, `json`, `css`, `html`, `bash` (also `sh`,
   * `shell`) or `diff`, plus a few aliases (`typescript`, `javascript`, `svg`, `xml`, `scss`, `patch`).
   * Any other value, or none, draws the code as plain text. Shown as a label in the header, as written.
   */
  language?: string;
  /**
   * A heading for the block, usually a file name (`Button.tsx`). Shown in the header and used as the block's
   * accessible name.
   */
  title?: string;
  /**
   * Numbers the lines, in a gutter that is not selected or copied.
   * @default false
   */
  showLineNumbers?: boolean;
  /**
   * The number shown on the first line, when the block is an excerpt from further down a file.
   * `highlightLines` counts from it too.
   * @default 1
   */
  startLine?: number;
  /**
   * Lines to draw attention to, by the numbers shown: single lines and ranges, `[2, "4-6"]`. Drawn with a band
   * and an edge accent, both in addition to colour. Numbers outside the code are ignored.
   */
  highlightLines?: Array<number | string>;
  /**
   * Wraps long lines instead of scrolling sideways. A wrapped line continues under its own text, not under
   * its line number.
   * @default false
   */
  wrap?: boolean;
  /**
   * The tallest the code may grow before it scrolls (`"24rem"`). Only meaningful for a long block; a
   * collapsible one uses it once expanded.
   */
  maxHeight?: CSSProperties["maxHeight"];
  /**
   * Shows only the first `collapsedLines` lines, with a button to reveal the rest. Has no effect on a block
   * that is no longer than that. Everything stays in the page, so find-in-page and the copy button use all of it.
   * @default false
   */
  collapsible?: boolean;
  /**
   * How many lines a collapsed block shows. A line that wraps still counts as one, however many rows it takes.
   * @default 10
   */
  collapsedLines?: number;
  /** Whether a collapsible block is expanded (controlled). Use with `onExpandedChange`. */
  expanded?: boolean;
  /**
   * Whether a collapsible block starts expanded (uncontrolled).
   * @default false
   */
  defaultExpanded?: boolean;
  /** Called when the expand or collapse button is pressed, with the new state. */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Shows a button that copies the code to the clipboard, and announces the result. It draws a check mark for
   * `copiedDuration` afterwards.
   * @default true
   */
  copyable?: boolean;
  /**
   * How long, in milliseconds, the copy button shows its check mark (or its warning, if copying failed)
   * before going back.
   * @default 2000
   */
  copiedDuration?: number;
  /** Called after the copy button has copied the code, with the code. Not called if the copy failed. (The native `onCopy` is a different thing: it fires when the reader copies a selection.) */
  onCopied?: (code: string) => void;
  /** The words the block writes itself; translate them here. Give only the ones you change. */
  labels?: Partial<CodeBlockLabels>;
  /**
   * Names the block for assistive tech, in place of `title`. Also names the scrollable region while the code
   * overflows.
   */
  "aria-label"?: string;
  /** The id of an already-visible element that names the block, in place of `aria-label` or `title`. */
  "aria-labelledby"?: string;
  /** The id of a description of the block. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes, merged with the component's own. */
  className?: string;
  /** Inline styles, merged onto the component's own. */
  style?: CSSProperties;
  /** Test identifier for automated testing; rendered as `data-testid` on the block. */
  "data-testid"?: string;
}
