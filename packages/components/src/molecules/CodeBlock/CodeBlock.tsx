import { ArrowBendDownLeftIcon, CheckIcon, CopyIcon, WarningIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, useAnnouncement } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./CodeBlock.module.css";
import type { CodeBlockLabels, CodeBlockProps, CodeBlockSize } from "./CodeBlock.types";
import { copyToClipboard } from "./copyToClipboard";
import { diffGutter, parseDiffNumbers } from "./diffNumbers";
import { parseHighlightLines } from "./highlightLines";
import { findRegisteredLanguage, subscribeToCodeLanguages } from "./registry";
import { textToCopy } from "./textToCopy";
import { resolveLanguage, tokenize } from "./tokenize";
import type { TokenType } from "./tokenize";
import { useCodeScroll } from "./useCodeScroll";
import { useCollapsedHeight } from "./useCollapsedHeight";

const defaultLabels: CodeBlockLabels = {
  wrap: "Wrap lines",
  copy: "Copy code",
  copied: "Copied",
  copyFailed: "Copy failed",
  expand: (hiddenLines) => `Show ${hiddenLines} more lines`,
  collapse: "Show less",
  highlighted: (count) => (count === 1 ? "Highlighted line:" : `${count} highlighted lines:`),
  region: "Code",
};

const tokenClass: Record<TokenType, string | undefined> = {
  keyword: styles.keyword,
  string: styles.string,
  number: styles.number,
  function: styles.function,
  type: styles.type,
  property: styles.property,
  tag: styles.tag,
  comment: styles.comment,
  inserted: styles.inserted,
  deleted: styles.deleted,
};

const sizeClass: Record<CodeBlockSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/** The header buttons' size for each `size`: the smaller steps stay above the 24px target-size floor. */
const buttonSize: Record<CodeBlockSize, "xs" | "sm" | "md"> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

type CopyState = { status: "idle" | "copied" | "failed"; count: number };

/**
 * A block of source code, with syntax highlighting, an optional title, line numbers, highlighted lines, a copy
 * button, and a way to collapse a long one. It is a `<figure>` around a scrollable `<pre><code>`.
 *
 * Highlighting is a small built-in tokenizer for `ts`, `tsx`, `js`, `jsx`, `json`, `css`, `html`, `bash` and
 * `diff`. Fifteen more languages (Python, YAML, SQL, Markdown, Go, Rust, Java, C, C++, C#, Kotlin, Swift, Ruby, PHP
 * and TOML) are opt-in: `registerCodeLanguage(pythonLanguage)` once, when the app starts. An app's own grammar
 * registers the same way, and a `highlighter` handles a single block; any other language is drawn as plain text.
 * It builds React elements from plain data and never sets HTML, so the code is always shown as text; it is
 * approximate, not a full grammar. Code stays left-to-right in a right-to-left page.
 *
 * `size` (`xs` to `xl`) scales the code, the space around it and the header buttons. The header holds the title,
 * the language and the buttons: a copy button, and with `wrapToggle` a button that turns line wrapping on and off
 * (`wrap` / `defaultWrap` / `onWrapChange` own the state). `showLanguage={false}` drops the language label, and
 * `showHeader={false}` drops the whole strip, leaving the buttons in the corner of the code. `showLineNumbers`
 * numbers the lines; on a `diff` with `@@` hunk headers it draws an old and a new column instead.
 *
 * The scrolling region is a tab stop, and named, only while the code overflows. The copy button copies exactly
 * `code`, whatever is collapsed, and announces "Copied" or "Copy failed".
 *
 * @example
 * ```tsx
 * <CodeBlock language="tsx" title="Greeting.tsx" showLineNumbers highlightLines={["2-3"]} code={source} />
 * <CodeBlock language="bash" code="pnpm add @dbm-design-system/components" />
 * <CodeBlock language="json" collapsible collapsedLines={6} code={longJson} />
 * <CodeBlock language="ts" size="sm" wrapToggle showLanguage={false} code={source} />
 * <CodeBlock language="diff" showLineNumbers code={gitDiffOutput} />
 * ```
 */
export const CodeBlock = forwardRef<HTMLElement, CodeBlockProps>(
  (
    {
      code,
      language,
      highlighter,
      title,
      size = "md",
      showHeader = true,
      showLanguage = true,
      showLineNumbers = false,
      startLine = 1,
      highlightLines,
      wrap: wrapProp,
      defaultWrap = false,
      onWrapChange,
      wrapToggle = false,
      maxHeight,
      collapsible = false,
      collapsedLines = 10,
      expanded: expandedProp,
      defaultExpanded = false,
      onExpandedChange,
      copyable = true,
      stripPrompt = true,
      copiedDuration = 2000,
      onCopied,
      labels: labelOverrides,
      className,
      style,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabels, labelOverrides);
    const titleId = useId();
    const frameId = useId();

    // `code` is required, but it is often data on its way (`code={snippet?.text}`): anything that is not a string is
    // drawn as an empty block, with a development warning, rather than crashing the page around it.
    const text = typeof code === "string" ? code : "";
    // The language the app has registered under this block's name, if any. Read from the store, so a language
    // registered (or removed) after the block was drawn, such as a grammar that loaded later, redraws it.
    const getRegistered = () => findRegisteredLanguage(language);
    const registered = useSyncExternalStore(subscribeToCodeLanguages, getRegistered, getRegistered);
    const lines = useMemo(() => tokenize(text, language, highlighter, registered), [text, language, highlighter, registered]);
    const highlighted = useMemo(() => parseHighlightLines(highlightLines), [highlightLines]);
    // A diff with hunk headers is numbered from them, an old and a new column, instead of counting its rows; one with
    // none (a hand-written snippet) has no line numbers to show, so it is drawn without a gutter.
    const isDiff = resolveLanguage(language) === "diff";
    const diffGutterOf = useMemo(() => {
      if (!showLineNumbers || !isDiff) return undefined;
      const numbers = parseDiffNumbers(lines.map((line) => line.map((token) => token.text).join("")));
      return numbers && diffGutter(numbers);
    }, [showLineNumbers, isDiff, lines]);
    const numbered = showLineNumbers && (!isDiff || diffGutterOf !== undefined);
    // In a numbered diff `highlightLines` counts the rows, from 1 (`startLine` has nothing to say there).
    const firstLine = diffGutterOf ? 1 : Number.isFinite(startLine) ? Math.trunc(startLine) : 1;
    const gutterDigits = diffGutterOf
      ? 2 * diffGutterOf.digits + 2
      : String(Math.max(Math.abs(firstLine), Math.abs(firstLine + lines.length - 1))).length + (firstLine < 0 ? 1 : 0);

    // A screen reader has no way to see the band, so the first line of each highlighted run says how many lines
    // it covers (never selected or copied).
    const highlightRuns = useMemo(() => {
      const runs = new Map<number, number>();
      const isHighlighted = (index: number) => highlighted.has(firstLine + index);
      for (let index = 0; index < lines.length; index++) {
        if (!isHighlighted(index) || (index > 0 && isHighlighted(index - 1))) continue;
        let length = 1;
        while (index + length < lines.length && isHighlighted(index + length)) length++;
        runs.set(index, length);
      }
      return runs;
    }, [highlighted, firstLine, lines.length]);

    // --- Wrapping: controlled with `wrap`, or uncontrolled from `defaultWrap` and changed by the toggle button.
    const [uncontrolledWrap, setUncontrolledWrap] = useState(defaultWrap);
    const wrap = wrapProp ?? uncontrolledWrap;
    const changeWrap = (next: boolean) => {
      if (wrapProp === undefined) setUncontrolledWrap(next);
      onWrapChange?.(next);
    };

    // --- Collapsing: controlled with `expanded`, or uncontrolled from `defaultExpanded`.
    const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
    const expanded = expandedProp ?? uncontrolledExpanded;
    const visibleLines = Math.max(1, Math.trunc(collapsedLines) || 1);
    const canCollapse = collapsible && lines.length > visibleLines;
    const collapsed = canCollapse && !expanded;
    const toggleExpanded = () => {
      if (expandedProp === undefined) setUncontrolledExpanded(!expanded);
      onExpandedChange?.(!expanded);
    };

    // --- Scrolling: a named tab stop only while the code overflows.
    const frameRef = useRef<HTMLDivElement>(null);
    const scrollable = useCodeScroll(frameRef, collapsed);
    // A wrapped line is one line however many rows it takes, so a wrapped block is cut where its Nth line ends.
    const collapsedHeight = useCollapsedHeight(frameRef, collapsed && wrap, visibleLines);
    // A title that isn't drawn (no header) can't be pointed at, so it names the block as text instead.
    const titleIsDrawn = Boolean(title) && showHeader;
    const regionName = ariaLabel
      ? { "aria-label": ariaLabel }
      : ariaLabelledBy
        ? { "aria-labelledby": ariaLabelledBy }
        : titleIsDrawn
          ? { "aria-labelledby": titleId }
          : { "aria-label": title || labels.region };

    // --- Copying.
    const [copy, setCopy] = useState<CopyState>({ status: "idle", count: 0 });
    const { message, announce } = useAnnouncement();
    useEffect(() => {
      if (copy.status === "idle") return;
      const timer = window.setTimeout(() => setCopy((current) => ({ ...current, status: "idle" })), copiedDuration);
      return () => window.clearTimeout(timer);
    }, [copy, copiedDuration]);
    const handleCopy = async () => {
      const toCopy = textToCopy(text, language, stripPrompt);
      const copied = await copyToClipboard(toCopy);
      setCopy((current) => ({ status: copied ? "copied" : "failed", count: current.count + 1 }));
      announce(copied ? labels.copied : labels.copyFailed);
      if (copied) onCopied?.(toCopy);
    };

    const codeIsNotText = typeof code !== "string";
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && codeIsNotText) {
        console.warn("CodeBlock: `code` should be a string — it is drawn as an empty block until it is one.");
      }
    }, [codeIsNotText]);

    const hasControls = copyable || wrapToggle;
    const languageIsDrawn = Boolean(language) && showLanguage;
    const hasHeader = showHeader && (titleIsDrawn || languageIsDrawn || hasControls);
    const floatingControls = !showHeader && hasControls;
    const controls = hasControls && (
      <span className={cx(styles.controls, floatingControls && styles.floating)}>
        {wrapToggle && (
          <IconButton
            icon={ArrowBendDownLeftIcon}
            aria-label={labels.wrap}
            variant="ghost"
            size={buttonSize[size]}
            pressed={wrap}
            onPressedChange={changeWrap}
          />
        )}
        {copyable && (
          <IconButton
            icon={copy.status === "copied" ? CheckIcon : copy.status === "failed" ? WarningIcon : CopyIcon}
            aria-label={labels.copy}
            variant="ghost"
            size={buttonSize[size]}
            data-copy-state={copy.status}
            onClick={handleCopy}
          />
        )}
      </span>
    );
    const frameStyle = {
      "--code-block-collapsed-lines": collapsed ? visibleLines : undefined,
      maxHeight: collapsed ? collapsedHeight || undefined : maxHeight,
    } as CSSProperties;

    return (
      <figure
        ref={ref}
        {...props}
        // Applied after `{...props}` so a same-named consumer prop can never replace them
        // (05-component-api-conventions.md §3).
        aria-label={ariaLabel ?? (title && !titleIsDrawn && !ariaLabelledBy ? title : undefined)}
        aria-labelledby={ariaLabel ? undefined : (ariaLabelledBy ?? (titleIsDrawn ? titleId : undefined))}
        style={{ "--code-block-gutter": `${gutterDigits}ch`, ...style } as CSSProperties}
        className={cx(
          styles.root,
          sizeClass[size],
          numbered && styles.numbered,
          diffGutterOf && styles.diffNumbered,
          wrap && styles.wrap,
          collapsed && styles.collapsed,
          floatingControls && styles.hasFloating,
          className,
        )}
        data-language={language || undefined}
      >
        {hasHeader && (
          <figcaption className={styles.header}>
            <span className={styles.meta}>
              {titleIsDrawn && (
                <span id={titleId} className={styles.title}>
                  {title}
                </span>
              )}
              {languageIsDrawn && <span className={styles.language}>{language}</span>}
            </span>
            {controls}
          </figcaption>
        )}
        <div className={styles.body}>
          {floatingControls && controls}
          <div
            id={frameId}
            ref={frameRef}
            className={styles.frame}
            style={frameStyle}
            // A scrolling box has to be reachable from the keyboard, and is announced as a region only once it
            // has a name to be announced by (it always has one here).
            {...(scrollable ? { tabIndex: 0, role: "region", ...regionName } : {})}
          >
            <pre className={styles.pre}>
              <code className={styles.code}>
                {lines.map((line, index) => {
                  const number = firstLine + index;
                  return (
                    <span key={index} className={styles.line} data-line={number}
                      data-numbers={diffGutterOf?.text[index]}
                      data-highlighted={highlighted.has(number) ? "true" : undefined}
                    >
                      {highlightRuns.has(index) && (
                        <VisuallyHidden className={styles.cue}>{labels.highlighted(highlightRuns.get(index) as number)}</VisuallyHidden>
                      )}
                      {line.map((token, tokenIndex) =>
                        token.type ? (
                          <span key={tokenIndex} className={tokenClass[token.type]}>
                            {token.text}
                          </span>
                        ) : (
                          token.text
                        ),
                      )}
                    </span>
                  );
                })}
              </code>
            </pre>
          </div>
          {collapsed && <span className={styles.fade} aria-hidden="true" />}
        </div>
        {canCollapse && (
          <div className={styles.footer}>
            <Button variant="ghost" size="sm" aria-expanded={expanded} aria-controls={frameId} onClick={toggleExpanded}>
              {expanded ? labels.collapse : labels.expand(lines.length - visibleLines)}
            </Button>
          </div>
        )}
        <VisuallyHidden role="status">{message}</VisuallyHidden>
      </figure>
    );
  },
);

CodeBlock.displayName = "CodeBlock";
