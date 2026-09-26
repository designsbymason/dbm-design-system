import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { Highlighter } from "./tokenizeTypes";

/**
 * The words `CodeBlock` writes itself, so they can be translated. The two that mention a count are functions
 * of it, since a language's plural rules (and word order) can't be built from a fixed string.
 */
export interface CodeBlockLabels {
  /**
   * The accessible name of the button that turns line wrapping on and off (`wrapToggle`). It stays the same
   * whichever way the block is set: whether it is on is said by the button's pressed state.
   * @default 'Wrap lines'
   */
  wrap: string;
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
   * Said in front of a highlighted line, or of the first of several in a row, for people who can't see the
   * band. Given how many lines the highlight covers: "Highlighted line:", "3 highlighted lines:". It is not
   * part of the code, so it is never selected or copied.
   * @default (count) => count === 1 ? "Highlighted line:" : `${count} highlighted lines:`
   */
  highlighted: (count: number) => string;
  /**
   * The name of the scrollable code region, used only when the block has no `title`, `aria-label` or
   * `aria-labelledby` to name it.
   * @default 'Code'
   */
  region: string;
}

/** The steps of `CodeBlock`'s `size`, on the shared scale. */
export type CodeBlockSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface CodeBlockProps extends Omit<ComponentPropsWithoutRef<"figure">, "children" | "title"> {
  /**
   * The source text to show. Line endings are normalised in what is drawn, and one trailing newline is dropped
   * (a template literal's last character is not a line). It is drawn as text, never as HTML, and it is what
   * the copy button copies, except that a shell prompt is taken off (see `stripPrompt`).
   */
  code: string;
  /**
   * The language to highlight it as. Built in: `ts`, `tsx`, `js`, `jsx`, `json`, `css`, `html`, `bash` and `diff`,
   * plus aliases (`typescript`, `javascript`, `sh`, `shell`, `svg`, `xml`, `scss`, `patch`). `python`, `yaml`,
   * `sql`, `markdown`, `go`, `rust` and `java` (with `py`, `yml`, `postgres`, `md`, `golang`, `rs`…) are
   * languages an app turns on with `registerCodeLanguage`, and so is any grammar of its own. Any other value, or
   * none, draws the code as plain text. Shown as a label in the header, as written.
   */
  language?: string;
  /**
   * Highlights this block itself, ahead of any registered or built-in language: given the text as it is drawn and
   * the `language` prop, it returns lines of `{ type?, text }` tokens (never HTML), or `undefined` to leave the
   * block to the registered and built-in languages. What it returns must join back to the code exactly (no
   * newline inside a token) or the block is drawn plain, and so it is if it throws. The size limit that protects
   * the built-in languages does not apply, so a large block's cost is the highlighter's. Give it a stable
   * function (define it outside the component, or memoise it): a new one on every render highlights again.
   */
  highlighter?: Highlighter;
  /**
   * A heading for the block, usually a file name (`Button.tsx`). Shown in the header and used as the block's
   * accessible name.
   */
  title?: string;
  /**
   * Shows the header: the title and language on one side, the buttons on the other. `false` is the minimal look:
   * no strip, and the block is named by `aria-label` or, failing that, the `title` (which is then not drawn).
   * The copy button and the wrap toggle, if they are on, stay, in the top corner of the code, always visible;
   * turn them off with `copyable={false}` and no `wrapToggle` for nothing but the code.
   * @default true
   */
  showHeader?: boolean;
  /**
   * Shows the language label in the header. `false` leaves the title and the buttons, and a block with nothing
   * else to show has no header at all.
   * @default true
   */
  showLanguage?: boolean;
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
   * How large the code is, on the shared scale. It sets the code's font size and the space around it, and the
   * size of the header's buttons. `md`, the default, is the size the block has always had. `xs` and `sm` share
   * the smallest font size the system has and differ in the space around the code.
   * @default 'md'
   */
  size?: CodeBlockSize;
  /**
   * Wraps long lines instead of scrolling sideways. A wrapped line continues under its own text, not under
   * its line number. Controlled with `onWrapChange` (or on its own, to fix it); use `defaultWrap` to start
   * wrapped and let `wrapToggle` change it.
   * @default false
   */
  wrap?: boolean;
  /**
   * Whether wrapping starts on, when it is not controlled with `wrap`.
   * @default false
   */
  defaultWrap?: boolean;
  /** Called when the wrap button is pressed, with the new state. */
  onWrapChange?: (wrap: boolean) => void;
  /**
   * Shows a button in the header that turns line wrapping on and off, for readers who would rather scroll or
   * rather wrap. It is a toggle: its pressed state says which. Without a header (`showHeader={false}`) it sits
   * in the corner of the code beside the copy button.
   * @default false
   */
  wrapToggle?: boolean;
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
   * For shell code (`bash`, `sh`, `shell`, `zsh`, `console`), takes a leading `$ ` prompt off each line that
   * has one when the code is copied, so a command shown as `$ pnpm add x` pastes as `pnpm add x`. The prompt is
   * still drawn. Only `$` followed by a space counts, and lines without a prompt (a comment, output) are copied
   * as they are, so keep a command's output in a block of its own. `false` copies the code exactly as written.
   * @default true
   */
  stripPrompt?: boolean;
  /**
   * How long, in milliseconds, the copy button shows its check mark (or its warning, if copying failed)
   * before going back.
   * @default 2000
   */
  copiedDuration?: number;
  /** Called after the copy button has copied the code, with the text that was copied. Not called if the copy failed. (The native `onCopy` is a different thing: it fires when the reader copies a selection.) */
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
