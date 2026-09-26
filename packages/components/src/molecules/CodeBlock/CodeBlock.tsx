import { CheckIcon, CopyIcon, WarningIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, useAnnouncement } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./CodeBlock.module.css";
import type { CodeBlockLabels, CodeBlockProps } from "./CodeBlock.types";
import { copyToClipboard } from "./copyToClipboard";
import { parseHighlightLines } from "./highlightLines";
import { tokenize } from "./tokenize";
import type { TokenType } from "./tokenize";
import { useCodeScroll } from "./useCodeScroll";

const defaultLabels: CodeBlockLabels = {
  copy: "Copy code",
  copied: "Copied",
  copyFailed: "Copy failed",
  expand: (hiddenLines) => `Show ${hiddenLines} more lines`,
  collapse: "Show less",
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

type CopyState = { status: "idle" | "copied" | "failed"; count: number };

/**
 * A block of source code, with syntax highlighting, an optional title, line numbers, highlighted lines, a copy
 * button, and a way to collapse a long one. It is a `<figure>` around a scrollable `<pre><code>`.
 *
 * Highlighting is a small built-in tokenizer for `ts`, `tsx`, `js`, `jsx`, `json`, `css`, `html`, `bash` and
 * `diff` (any other language is drawn as plain text). It builds React elements from plain data and never
 * sets HTML, so the code is always shown as text; it is approximate, not a full grammar. Code stays
 * left-to-right in a right-to-left page.
 *
 * The scrolling region is a tab stop, and named, only while the code overflows. The copy button copies exactly
 * `code`, whatever is collapsed, and announces "Copied" or "Copy failed".
 *
 * @example
 * ```tsx
 * <CodeBlock language="tsx" title="Greeting.tsx" showLineNumbers highlightLines={["2-3"]} code={source} />
 * <CodeBlock language="bash" code="pnpm add @dbm-design-system/components" />
 * <CodeBlock language="json" collapsible collapsedLines={6} code={longJson} />
 * ```
 */
export const CodeBlock = forwardRef<HTMLElement, CodeBlockProps>(
  (
    {
      code,
      language,
      title,
      showLineNumbers = false,
      startLine = 1,
      highlightLines,
      wrap = false,
      maxHeight,
      collapsible = false,
      collapsedLines = 10,
      expanded: expandedProp,
      defaultExpanded = false,
      onExpandedChange,
      copyable = true,
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

    const lines = useMemo(() => tokenize(code, language), [code, language]);
    const highlighted = useMemo(() => parseHighlightLines(highlightLines), [highlightLines]);
    const firstLine = Number.isFinite(startLine) ? Math.trunc(startLine) : 1;
    const gutterDigits = String(Math.max(Math.abs(firstLine), Math.abs(firstLine + lines.length - 1))).length + (firstLine < 0 ? 1 : 0);

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
    const regionName = ariaLabel
      ? { "aria-label": ariaLabel }
      : ariaLabelledBy
        ? { "aria-labelledby": ariaLabelledBy }
        : title
          ? { "aria-labelledby": titleId }
          : { "aria-label": labels.region };

    // --- Copying.
    const [copy, setCopy] = useState<CopyState>({ status: "idle", count: 0 });
    const { message, announce } = useAnnouncement();
    useEffect(() => {
      if (copy.status === "idle") return;
      const timer = window.setTimeout(() => setCopy((current) => ({ ...current, status: "idle" })), copiedDuration);
      return () => window.clearTimeout(timer);
    }, [copy, copiedDuration]);
    const handleCopy = async () => {
      const copied = await copyToClipboard(code);
      setCopy((current) => ({ status: copied ? "copied" : "failed", count: current.count + 1 }));
      announce(copied ? labels.copied : labels.copyFailed);
      if (copied) onCopied?.(code);
    };

    const hasHeader = Boolean(title || language) || copyable;
    const frameStyle = {
      "--code-block-collapsed-lines": collapsed ? visibleLines : undefined,
      maxHeight: collapsed ? undefined : maxHeight,
    } as CSSProperties;

    return (
      <figure
        ref={ref}
        {...props}
        // Applied after `{...props}` so a same-named consumer prop can never replace them
        // (05-component-api-conventions.md §3).
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : (ariaLabelledBy ?? (title ? titleId : undefined))}
        style={{ "--code-block-gutter": `${gutterDigits}ch`, ...style } as CSSProperties}
        className={cx(styles.root, showLineNumbers && styles.numbered, wrap && styles.wrap, collapsed && styles.collapsed, className)}
        data-language={language || undefined}
      >
        {hasHeader && (
          <figcaption className={styles.header}>
            <span className={styles.meta}>
              {title && (
                <span id={titleId} className={styles.title}>
                  {title}
                </span>
              )}
              {language && <span className={styles.language}>{language}</span>}
            </span>
            {copyable && (
              <IconButton
                icon={copy.status === "copied" ? CheckIcon : copy.status === "failed" ? WarningIcon : CopyIcon}
                aria-label={labels.copy}
                variant="ghost"
                size="sm"
                data-copy-state={copy.status}
                onClick={handleCopy}
              />
            )}
          </figcaption>
        )}
        <div className={styles.body}>
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
                    <span key={index} className={styles.line} data-line={number} data-highlighted={highlighted.has(number) ? "true" : undefined}>
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
