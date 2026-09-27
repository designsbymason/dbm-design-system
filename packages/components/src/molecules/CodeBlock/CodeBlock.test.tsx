import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";
import styles from "./CodeBlock.module.css";
import iconButtonStyles from "../../atoms/IconButton/IconButton.module.css";
import { csharpLanguage, pythonLanguage } from "./grammars";
import { registerCodeLanguage } from "./registry";
import type { Highlighter } from "./tokenizeTypes";

const source = ["const greeting = 'hello';", "", "function greet(name: string) {", "  return `${greeting}, ${name}`;", "}"].join("\n");
const longSource = Array.from({ length: 30 }, (_, index) => `line ${index + 1}`).join("\n");

let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  // jsdom has no layout, so a test that wants overflow defines it, and undoes it here.
  for (const key of ["scrollWidth", "clientWidth", "scrollHeight", "clientHeight"]) {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});

const overflow = (values: Partial<Record<"scrollWidth" | "clientWidth" | "scrollHeight" | "clientHeight", number>>) => {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => value });
  }
};

const codeElement = () => document.querySelector("code") as HTMLElement;

describe("CodeBlock", () => {
  it("shows the code as text in a pre and a code element, inside a figure", () => {
    render(<CodeBlock code={source} language="ts" />);
    const figure = screen.getByRole("figure");
    expect(figure.querySelector("pre > code")).toBe(codeElement());
    expect(codeElement().textContent).toBe(source.replace(/\n/g, ""));
    expect(codeElement().querySelectorAll("span[data-line]")).toHaveLength(5);
  });

  it("colours tokens with their own classes, and draws unknown languages plain", () => {
    const { rerender } = render(<CodeBlock code="const a = 1;" language="ts" />);
    expect(screen.getByText("const")).toHaveClass(styles.keyword as string);
    expect(screen.getByText("1")).toHaveClass(styles.number as string);
    rerender(<CodeBlock code="const a = 1;" language="cobol" />);
    // Plain text: a line holds its text directly, with no token element in it.
    expect(codeElement().querySelectorAll("span[data-line] > span")).toHaveLength(0);
    expect(codeElement()).toHaveTextContent("const a = 1;");
    expect(screen.queryByText("const")).not.toBeInTheDocument();
  });

  it("never turns the code into markup", () => {
    render(<CodeBlock code={'<img src=x onerror="alert(1)"><script>alert(2)</script>'} language="html" />);
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector("script")).toBeNull();
    expect(codeElement().textContent).toContain("<img src=x");
  });

  it("draws code that is not a string as an empty block, warning once, instead of crashing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<CodeBlock code={undefined as never} language="ts" aria-label="Loading" />);
    expect(screen.getByRole("figure", { name: "Loading" })).toBeInTheDocument();
    expect(codeElement().querySelectorAll("span[data-line]")).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("`code` should be a string"));
    // Once the text arrives it is drawn, and no further warning.
    rerender(<CodeBlock code="const a = 1;" language="ts" aria-label="Loading" />);
    expect(screen.getByText("const")).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("copies an empty string, not undefined, while code is not text", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<CodeBlock code={null as never} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(""));
  });

  it("draws a language that is not a string as plain text", () => {
    render(<CodeBlock code="const a = 1" language={5 as never} />);
    expect(codeElement().querySelectorAll("span[data-line] > span")).toHaveLength(0);
  });

  it("drops one trailing newline and keeps blank lines", () => {
    render(<CodeBlock code={"a\n\nb\n"} language="text" />);
    expect(codeElement().querySelectorAll("span[data-line]")).toHaveLength(3);
  });

  describe("naming", () => {
    it("is named by its title, and shows it with the language", () => {
      render(<CodeBlock code={source} language="ts" title="greet.ts" />);
      expect(screen.getByRole("figure", { name: "greet.ts" })).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("prefers aria-label, then aria-labelledby, to the title", () => {
      const { rerender } = render(<CodeBlock code={source} title="greet.ts" aria-label="Greeting" />);
      expect(screen.getByRole("figure", { name: "Greeting" })).toBeInTheDocument();
      rerender(
        <>
          <span id="own">Own name</span>
          <CodeBlock code={source} title="greet.ts" aria-labelledby="own" />
        </>,
      );
      expect(screen.getByRole("figure", { name: "Own name" })).toBeInTheDocument();
    });

    it("has no header without a title, a language or a copy button", () => {
      const { container } = render(<CodeBlock code={source} copyable={false} />);
      expect(container.querySelector("figcaption")).toBeNull();
    });
  });

  it("forwards its ref and takes className, style, id, a test id and native attributes on the figure", () => {
    const ref = createRef<HTMLElement>();
    const onFocus = vi.fn();
    render(<CodeBlock ref={ref} code="a" className="mine" style={{ color: "red" }} id="block" data-testid="cb" onFocus={onFocus} tabIndex={-1} />);
    const figure = screen.getByTestId("cb");
    expect(ref.current).toBe(figure);
    expect(figure.tagName).toBe("FIGURE");
    expect(figure).toHaveClass("mine");
    expect(figure).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(figure).toHaveAttribute("id", "block");
    fireEvent.focus(figure);
    expect(onFocus).toHaveBeenCalled();
  });

  describe("line numbers and highlighted lines", () => {
    it("numbers every line from startLine, in data-line, and adds the numbered class", () => {
      render(<CodeBlock code={"a\nb\nc"} showLineNumbers startLine={8} data-testid="cb" />);
      expect([...codeElement().querySelectorAll("span[data-line]")].map((line) => line.getAttribute("data-line"))).toEqual(["8", "9", "10"]);
      expect(screen.getByTestId("cb")).toHaveClass(styles.numbered as string);
      expect(screen.getByTestId("cb").style.getPropertyValue("--code-block-gutter")).toBe("2ch");
    });

    it("does not put the numbers in the text, so they are never copied by selection", () => {
      render(<CodeBlock code={"a\nb"} showLineNumbers />);
      expect(codeElement().textContent).toBe("ab");
    });

    it("marks the lines named by numbers and ranges, counting from startLine", () => {
      render(<CodeBlock code={"a\nb\nc\nd\ne"} startLine={10} highlightLines={[10, "12-13", "bad", 99]} />);
      const marked = [...codeElement().querySelectorAll("span[data-line]")].map((line) => line.getAttribute("data-highlighted"));
      expect(marked).toEqual(["true", null, "true", "true", null]);
    });
  });

  it("wraps with the wrap class", () => {
    render(<CodeBlock code="a" wrap data-testid="cb" />);
    expect(screen.getByTestId("cb")).toHaveClass(styles.wrap as string);
  });

  describe("highlighted lines, for a screen reader", () => {
    it("says how many lines a highlight covers, in front of its first line only", () => {
      render(<CodeBlock code={"a\nb\nc\nd\ne\nf"} language="text" highlightLines={[2, 3, 6]} />);
      const cues = [...codeElement().querySelectorAll("span[data-line]")].map((line) => line.textContent?.match(/^(Highlighted line:|\d+ highlighted lines:)/)?.[0] ?? null);
      expect(cues).toEqual([null, "2 highlighted lines:", null, null, null, "Highlighted line:"]);
    });

    it("says nothing without a highlight", () => {
      render(<CodeBlock code={"a\nb"} language="text" />);
      expect(codeElement().textContent).toBe("ab");
    });

    it("counts a run that reaches the last line, and one from startLine", () => {
      render(<CodeBlock code={"a\nb\nc"} language="text" startLine={5} highlightLines={["6-7"]} />);
      expect(codeElement().textContent).toBe("a2 highlighted lines:bc");
    });

    it("translates the words, and keeps the default whose translation is undefined", () => {
      const { rerender } = render(<CodeBlock code={"a\nb"} language="text" highlightLines={[1, 2]} labels={{ highlighted: (count) => `${count} lignes surlignées :` }} />);
      expect(codeElement().textContent).toBe("2 lignes surlignées :ab");
      rerender(<CodeBlock code={"a\nb"} language="text" highlightLines={[1]} labels={{ highlighted: undefined }} />);
      expect(codeElement().textContent).toBe("Highlighted line:ab");
    });

    it("is not part of what is copied", async () => {
      render(<CodeBlock code={"a\nb"} language="text" highlightLines={[1, 2]} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith("a\nb"));
    });

    it("is not selectable", () => {
      render(<CodeBlock code="a" language="text" highlightLines={[1]} />);
      expect(screen.getByText("Highlighted line:")).toHaveClass(styles.cue as string);
    });
  });

  describe("copying", () => {
    it("copies exactly the code and calls onCopied", async () => {
      const onCopied = vi.fn();
      render(<CodeBlock code={source} onCopied={onCopied} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(source));
      await waitFor(() => expect(onCopied).toHaveBeenCalledWith(source));
      expect(screen.getByRole("button", { name: "Copy code" })).toHaveAttribute("data-copy-state", "copied");
    });

    it("takes a shell prompt off what it copies, and gives onCopied what was copied", async () => {
      const onCopied = vi.fn();
      render(<CodeBlock code={"$ pnpm add x\n$ pnpm test"} language="bash" onCopied={onCopied} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith("pnpm add x\npnpm test"));
      expect(onCopied).toHaveBeenCalledWith("pnpm add x\npnpm test");
      // What is drawn still has the prompt.
      expect(codeElement().textContent).toContain("$ pnpm add x");
    });

    it("copies the prompt too with stripPrompt={false}, and never strips outside a shell", async () => {
      const { rerender } = render(<CodeBlock code="$ pnpm add x" language="bash" stripPrompt={false} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenLastCalledWith("$ pnpm add x"));
      rerender(<CodeBlock code="$ x = 1" language="ts" />);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenLastCalledWith("$ x = 1"));
    });

    it("announces Copied, in a live region that is already in the page", async () => {
      render(<CodeBlock code="a" />);
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copied"));
    });

    it("says so when copying fails, and does not call onCopied", async () => {
      writeText.mockRejectedValue(new Error("denied"));
      Object.defineProperty(document, "execCommand", { configurable: true, value: vi.fn().mockReturnValue(false) });
      const onCopied = vi.fn();
      render(<CodeBlock code="a" onCopied={onCopied} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copy failed"));
      expect(onCopied).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Copy code" })).toHaveAttribute("data-copy-state", "failed");
    });

    it("falls back to selecting a hidden field when the Clipboard API is missing", async () => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
      const execCommand = vi.fn().mockReturnValue(true);
      Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
      // A real browser may move focus to the field it selects; do the same here so the restore has work to do.
      vi.spyOn(HTMLTextAreaElement.prototype, "select").mockImplementation(function (this: HTMLTextAreaElement) {
        this.focus();
      });
      render(<CodeBlock code="fallback text" />);
      const button = screen.getByRole("button", { name: "Copy code" });
      button.focus();
      fireEvent.click(button);
      await waitFor(() => expect(execCommand).toHaveBeenCalledWith("copy"));
      await waitFor(() => expect(button).toHaveAttribute("data-copy-state", "copied"));
      expect(document.querySelector("textarea")).toBeNull();
      expect(button).toHaveFocus();
    });

    it("goes back to idle after copiedDuration, and restarts the wait on a second copy", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      render(<CodeBlock code="a" copiedDuration={1000} />);
      const button = screen.getByRole("button", { name: "Copy code" });
      fireEvent.click(button);
      await waitFor(() => expect(button).toHaveAttribute("data-copy-state", "copied"));
      act(() => void vi.advanceTimersByTime(800));
      fireEvent.click(button);
      await act(async () => void (await Promise.resolve()));
      act(() => void vi.advanceTimersByTime(800));
      expect(button).toHaveAttribute("data-copy-state", "copied");
      act(() => void vi.advanceTimersByTime(400));
      expect(button).toHaveAttribute("data-copy-state", "idle");
    });

    it("has no copy button with copyable={false}", () => {
      render(<CodeBlock code="a" copyable={false} title="x" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("survives StrictMode", async () => {
      render(
        <StrictMode>
          <CodeBlock code="a" />
        </StrictMode>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    });
  });

  describe("collapsing", () => {
    it("shows no button for a block that is not longer than collapsedLines, or when not collapsible", () => {
      const { rerender } = render(<CodeBlock code={longSource} collapsible collapsedLines={30} copyable={false} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      rerender(<CodeBlock code={longSource} copyable={false} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("collapses to collapsedLines with a button that says how many it will reveal, and keeps every line in the page", () => {
      render(<CodeBlock code={longSource} collapsible collapsedLines={8} copyable={false} data-testid="cb" />);
      const button = screen.getByRole("button", { name: "Show 22 more lines" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByTestId("cb")).toHaveClass(styles.collapsed as string);
      expect(codeElement().querySelectorAll("span[data-line]")).toHaveLength(30);
      expect(document.getElementById(button.getAttribute("aria-controls") as string)).toContainElement(codeElement());
    });

    it("expands and collapses, uncontrolled", () => {
      render(<CodeBlock code={longSource} collapsible copyable={false} data-testid="cb" />);
      fireEvent.click(screen.getByRole("button", { name: "Show 20 more lines" }));
      expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByTestId("cb")).not.toHaveClass(styles.collapsed as string);
      fireEvent.click(screen.getByRole("button", { name: "Show less" }));
      expect(screen.getByTestId("cb")).toHaveClass(styles.collapsed as string);
    });

    it("can start expanded", () => {
      render(<CodeBlock code={longSource} collapsible defaultExpanded copyable={false} />);
      expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
    });

    it("is controlled by expanded, and reports onExpandedChange", () => {
      const onExpandedChange = vi.fn();
      const { rerender } = render(<CodeBlock code={longSource} collapsible expanded={false} onExpandedChange={onExpandedChange} copyable={false} />);
      fireEvent.click(screen.getByRole("button", { name: "Show 20 more lines" }));
      expect(onExpandedChange).toHaveBeenCalledWith(true);
      // Still collapsed: the parent has not said otherwise.
      expect(screen.getByRole("button", { name: "Show 20 more lines" })).toBeInTheDocument();
      rerender(<CodeBlock code={longSource} collapsible expanded onExpandedChange={onExpandedChange} copyable={false} />);
      expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
    });

    it("copies all of it while collapsed", async () => {
      render(<CodeBlock code={longSource} collapsible />);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(longSource));
    });

    it("applies maxHeight to the expanded block, not the collapsed one", () => {
      const { container } = render(<CodeBlock code={longSource} collapsible maxHeight="12rem" copyable={false} />);
      const frame = container.querySelector(`.${styles.frame}`) as HTMLElement;
      expect(frame.style.maxHeight).toBe("");
      expect(frame.style.getPropertyValue("--code-block-collapsed-lines")).toBe("10");
      fireEvent.click(screen.getByRole("button", { name: /Show/ }));
      expect(frame.style.maxHeight).toBe("12rem");
    });
  });

  describe("the scrolling region", () => {
    const frameOf = (container: HTMLElement) => container.querySelector(`.${styles.frame}`) as HTMLElement;

    it("is not a tab stop while the code fits", () => {
      const { container } = render(<CodeBlock code={source} />);
      expect(frameOf(container)).not.toHaveAttribute("tabindex");
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });

    it("is a named tab stop while it overflows sideways, named by the title, aria-label, or a default", () => {
      overflow({ scrollWidth: 500, clientWidth: 200, scrollHeight: 100, clientHeight: 100 });
      const { container, rerender } = render(<CodeBlock code={source} title="greet.ts" />);
      expect(frameOf(container)).toHaveAttribute("tabindex", "0");
      expect(screen.getByRole("region", { name: "greet.ts" })).toBe(frameOf(container));
      rerender(<CodeBlock code={source} aria-label="Greeting" />);
      expect(screen.getByRole("region", { name: "Greeting" })).toBeInTheDocument();
      rerender(<CodeBlock code={source} />);
      expect(screen.getByRole("region", { name: "Code" })).toBeInTheDocument();
    });

    it("is a tab stop when it scrolls vertically, but not when the height is only clipped by collapsing", () => {
      overflow({ scrollWidth: 200, clientWidth: 200, scrollHeight: 900, clientHeight: 300 });
      const { container, rerender } = render(<CodeBlock code={longSource} maxHeight="10rem" />);
      expect(frameOf(container)).toHaveAttribute("tabindex", "0");
      rerender(<CodeBlock code={longSource} collapsible />);
      expect(frameOf(container)).not.toHaveAttribute("tabindex");
    });
  });

  it("translates its words, one at a time, keeping a default whose translation is undefined", () => {
    render(
      <CodeBlock
        code={longSource}
        collapsible
        labels={{ copy: "Copier", expand: (count) => `Encore ${count}`, collapse: undefined }}
      />,
    );
    expect(screen.getByRole("button", { name: "Copier" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Encore 20" }));
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
  });

  it("updates when the code or language changes", () => {
    const { rerender } = render(<CodeBlock code="const a = 1" language="ts" />);
    expect(screen.getByText("const")).toBeInTheDocument();
    rerender(<CodeBlock code="let b = 2" language="ts" />);
    expect(screen.getByText("let")).toHaveClass(styles.keyword as string);
    expect(within(codeElement()).queryByText("const")).not.toBeInTheDocument();
  });

  describe("accessibility", () => {
    it.each([
      ["plain", <CodeBlock key="a" code={source} language="ts" aria-label="Example" />],
      ["with a title, numbers and highlighted lines", <CodeBlock key="b" code={source} language="ts" title="greet.ts" showLineNumbers highlightLines={["2-3"]} />],
      ["collapsed", <CodeBlock key="c" code={longSource} collapsible title="long.txt" />],
      ["a diff", <CodeBlock key="d" code={"-a\n+b\n c"} language="diff" aria-label="Change" />],
      ["JSX", <CodeBlock key="e" code={'<Button variant="primary">Save</Button>'} language="tsx" aria-label="Usage" />],
      ["without a copy button", <CodeBlock key="f" code={source} copyable={false} aria-label="Example" />],
    ])("has no axe violations: %s", async (_label, element) => {
      const { container } = render(element);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has none while the region scrolls", async () => {
      overflow({ scrollWidth: 500, clientWidth: 200, scrollHeight: 100, clientHeight: 100 });
      const { container } = render(<CodeBlock code={source} title="greet.ts" />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

describe("CodeBlock: choosing who highlights", () => {
  const cleanup: Array<() => void> = [];
  afterEach(() => {
    while (cleanup.length) cleanup.pop()?.();
  });
  const upper: Highlighter = (code) => code.split("\n").map((text) => (text ? [{ type: "type" as const, text }] : []));

  it("draws a block with the highlighter it is given, as elements, never as markup", () => {
    render(<CodeBlock code={"<b>x</b>\nline two"} language="cobol" highlighter={upper} />);
    expect(screen.getByText("line two")).toHaveClass(styles.type as string);
    expect(document.querySelector("b")).toBeNull();
    expect(codeElement().textContent).toBe("<b>x</b>line two");
  });

  it("draws again when the highlighter changes", () => {
    const { rerender } = render(<CodeBlock code="a" highlighter={upper} />);
    expect(screen.getByText("a")).toHaveClass(styles.type as string);
    rerender(<CodeBlock code="a" highlighter={(code) => [[{ type: "string", text: code }]]} />);
    expect(screen.getByText("a")).toHaveClass(styles.string as string);
  });

  it("draws plain, with the code intact and no crash, when the highlighter is faulty", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<CodeBlock code={"keep\nall of it"} highlighter={() => [[{ text: "lost" }]]} />);
    expect(codeElement().textContent).toBe("keepall of it");
    render(
      <CodeBlock
        code="still here"
        highlighter={() => {
          throw new Error("boom");
        }}
      />,
    );
    expect(screen.getByText("still here")).toBeInTheDocument();
  });

  it("copies the code, whatever the highlighter drew", async () => {
    render(<CodeBlock code="real code" highlighter={() => [[{ type: "string", text: "real code" }]]} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("real code"));
  });

  it("draws a registered language, and redraws a block already on the page when one is registered or removed", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined); // it says the language is opt-in (see registry.test.ts)
    render(<CodeBlock code="def f(): pass" language="python" />);
    // Not registered: plain.
    expect(codeElement().querySelectorAll("span[data-line] > span")).toHaveLength(0);
    let unregister = () => undefined as void;
    act(() => {
      unregister = registerCodeLanguage(pythonLanguage);
      cleanup.push(unregister);
    });
    expect(screen.getByText("def")).toHaveClass(styles.keyword as string);
    act(() => unregister());
    expect(codeElement().querySelectorAll("span[data-line] > span")).toHaveLength(0);
    expect(codeElement()).toHaveTextContent("def f(): pass");
  });

  it("prefers the block's own highlighter to a registered language", () => {
    cleanup.push(registerCodeLanguage(pythonLanguage));
    render(<CodeBlock code="def f(): pass" language="py" highlighter={upper} />);
    expect(screen.getByText("def f(): pass")).toHaveClass(styles.type as string);
  });

  it("draws a registered language on the server, so the first frame is already coloured", () => {
    cleanup.push(registerCodeLanguage(pythonLanguage));
    const html = renderToString(<CodeBlock code="def f(): pass" language="python" />);
    expect(html).toContain(`class="${styles.keyword}"`);
    expect(html).toContain("def");
  });

  it("has no accessibility violations with a highlighter", async () => {
    const { container } = render(<CodeBlock code="a\nb" title="x.txt" highlighter={upper} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CodeBlock: size", () => {
  const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
  const rootClass = { xs: styles.sizeXs, sm: styles.sizeSm, md: styles.sizeMd, lg: styles.sizeLg, xl: styles.sizeXl };
  const buttonClass = { xs: iconButtonStyles.sizeXs, sm: iconButtonStyles.sizeXs, md: iconButtonStyles.sizeSm, lg: iconButtonStyles.sizeSm, xl: iconButtonStyles.sizeMd };

  it("is md, the size the block has always had, unless it is told otherwise", () => {
    render(<CodeBlock code="a" />);
    expect(screen.getByRole("figure")).toHaveClass(styles.sizeMd as string);
    for (const other of ["sizeXs", "sizeSm", "sizeLg", "sizeXl"] as const) expect(screen.getByRole("figure")).not.toHaveClass(styles[other] as string);
  });

  it.each(sizes)("puts the %s class on the block, and sizes the header buttons to match", (size) => {
    render(<CodeBlock code="a" size={size} wrapToggle />);
    expect(screen.getByRole("figure")).toHaveClass(rootClass[size] as string);
    for (const name of ["Wrap lines", "Copy code"]) expect(screen.getByRole("button", { name })).toHaveClass(buttonClass[size] as string);
  });

  it("draws an unknown size as the default look, without crashing", () => {
    render(<CodeBlock code="a" size={"huge" as never} />);
    expect(screen.getByRole("figure")).toBeInTheDocument();
    expect(codeElement()).toHaveTextContent("a");
  });

  it("has no accessibility violations at any size", async () => {
    for (const size of sizes) {
      const { container, unmount } = render(<CodeBlock code="a" size={size} title="x.ts" wrapToggle />);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});

describe("CodeBlock: the wrap toggle", () => {
  const long = "a very long line ".repeat(10);

  it("is not there unless asked for", () => {
    render(<CodeBlock code={long} />);
    expect(screen.queryByRole("button", { name: "Wrap lines" })).not.toBeInTheDocument();
  });

  it("is a toggle button that turns wrapping on and off, saying which by its pressed state", () => {
    render(<CodeBlock code={long} wrapToggle />);
    const toggle = screen.getByRole("button", { name: "Wrap lines" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("figure")).not.toHaveClass(styles.wrap as string);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("figure")).toHaveClass(styles.wrap as string);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("figure")).not.toHaveClass(styles.wrap as string);
  });

  it("starts on with defaultWrap, and still turns off", () => {
    render(<CodeBlock code={long} wrapToggle defaultWrap />);
    const toggle = screen.getByRole("button", { name: "Wrap lines" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("figure")).toHaveClass(styles.wrap as string);
    fireEvent.click(toggle);
    expect(screen.getByRole("figure")).not.toHaveClass(styles.wrap as string);
  });

  it("wraps without a button when wrap is set, exactly as before", () => {
    render(<CodeBlock code={long} wrap />);
    expect(screen.getByRole("figure")).toHaveClass(styles.wrap as string);
  });

  it("is controlled by wrap: it asks with onWrapChange and changes only when the prop does", () => {
    const onWrapChange = vi.fn();
    const { rerender } = render(<CodeBlock code={long} wrapToggle wrap={false} onWrapChange={onWrapChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Wrap lines" }));
    expect(onWrapChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("figure")).not.toHaveClass(styles.wrap as string);
    expect(screen.getByRole("button", { name: "Wrap lines" })).toHaveAttribute("aria-pressed", "false");
    rerender(<CodeBlock code={long} wrapToggle wrap onWrapChange={onWrapChange} />);
    expect(screen.getByRole("figure")).toHaveClass(styles.wrap as string);
    expect(screen.getByRole("button", { name: "Wrap lines" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Wrap lines" }));
    expect(onWrapChange).toHaveBeenLastCalledWith(false);
  });

  it("tells onWrapChange the new state when it is not controlled too", () => {
    const onWrapChange = vi.fn();
    render(<CodeBlock code={long} wrapToggle onWrapChange={onWrapChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Wrap lines" }));
    fireEvent.click(screen.getByRole("button", { name: "Wrap lines" }));
    expect(onWrapChange.mock.calls).toEqual([[true], [false]]);
  });

  it("is in the header, before the copy button, and gives a block with no title a header", () => {
    const { container } = render(<CodeBlock code={long} wrapToggle />);
    const buttons = [...container.querySelectorAll("figcaption button")].map((button) => button.getAttribute("aria-label"));
    expect(buttons).toEqual(["Wrap lines", "Copy code"]);
    const alone = render(<CodeBlock code={long} wrapToggle copyable={false} />);
    expect(alone.container.querySelector("figcaption")?.querySelectorAll("button")).toHaveLength(1);
  });

  it("is named in the language the labels give, one label at a time", () => {
    const { rerender } = render(<CodeBlock code={long} wrapToggle labels={{ wrap: "Renvoyer à la ligne" }} />);
    expect(screen.getByRole("button", { name: "Renvoyer à la ligne" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    rerender(<CodeBlock code={long} wrapToggle labels={{ wrap: undefined }} />);
    expect(screen.getByRole("button", { name: "Wrap lines" })).toBeInTheDocument();
  });

  it("keeps every character when it is switched", () => {
    render(<CodeBlock code={long} wrapToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Wrap lines" }));
    expect(codeElement().textContent).toBe(long);
  });
});

describe("CodeBlock: showHeader and showLanguage", () => {
  const scrolling = () => overflow({ scrollWidth: 500, clientWidth: 200, scrollHeight: 100, clientHeight: 100 });

  it("shows the title, the language and the buttons by default", () => {
    const { container } = render(<CodeBlock code="a" title="x.ts" language="ts" />);
    const header = container.querySelector("figcaption") as HTMLElement;
    expect(within(header).getByText("x.ts")).toBeInTheDocument();
    expect(within(header).getByText("TypeScript")).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "Copy code" })).toBeInTheDocument();
  });

  describe("showLanguage", () => {
    it("leaves the language out of the header, and keeps the title and the buttons", () => {
      const { container } = render(<CodeBlock code="a" title="x.ts" language="ts" showLanguage={false} />);
      const header = container.querySelector("figcaption") as HTMLElement;
      expect(within(header).queryByText("TypeScript")).not.toBeInTheDocument();
      expect(within(header).getByText("x.ts")).toBeInTheDocument();
      expect(within(header).getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    });

    it("still highlights, and still says the language in data-language", () => {
      render(<CodeBlock code="const a = 1;" language="ts" showLanguage={false} />);
      expect(screen.getByText("const")).toHaveClass(styles.keyword as string);
      expect(screen.getByRole("figure")).toHaveAttribute("data-language", "ts");
    });

    it("leaves a block with only a language to show, and no buttons, with no header at all", () => {
      const { container } = render(<CodeBlock code="a" language="ts" copyable={false} showLanguage={false} />);
      expect(container.querySelector("figcaption")).toBeNull();
    });
  });

  describe("showHeader={false}", () => {
    it("draws no header: no title, no language, no caption", () => {
      const { container } = render(<CodeBlock code="a" title="x.ts" language="ts" showHeader={false} />);
      expect(container.querySelector("figcaption")).toBeNull();
      expect(screen.queryByText("x.ts")).not.toBeInTheDocument();
      expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
    });

    it("keeps the copy button and the wrap toggle in the corner of the code, ahead of it in the tab order", () => {
      const { container } = render(<CodeBlock code="a" showHeader={false} wrapToggle />);
      const controls = screen.getByRole("button", { name: "Copy code" }).parentElement as HTMLElement;
      expect(controls).toHaveClass(styles.floating as string);
      expect(controls.closest(`.${styles.body}`)).not.toBeNull();
      expect(screen.getByRole("figure")).toHaveClass(styles.hasFloating as string);
      expect([...controls.querySelectorAll("button")].map((button) => button.getAttribute("aria-label"))).toEqual(["Wrap lines", "Copy code"]);
      // The buttons come before the code in the document, so a keyboard reaches them first, as it does in a header.
      expect(controls.compareDocumentPosition(container.querySelector("pre") as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("has nothing but the code without them, and reserves no room for them", () => {
      const { container } = render(<CodeBlock code="a" showHeader={false} copyable={false} />);
      expect(container.querySelector("button")).toBeNull();
      expect(container.querySelector(`.${styles.floating}`)).toBeNull();
      expect(screen.getByRole("figure")).not.toHaveClass(styles.hasFloating as string);
    });

    it("still copies, and still toggles wrapping", async () => {
      render(<CodeBlock code="real code" showHeader={false} wrapToggle />);
      fireEvent.click(screen.getByRole("button", { name: "Wrap lines" }));
      expect(screen.getByRole("figure")).toHaveClass(styles.wrap as string);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith("real code"));
    });

    it("names the block by its title, as text, since the title is not drawn", () => {
      render(<CodeBlock code="a" title="greet.ts" showHeader={false} />);
      const figure = screen.getByRole("figure", { name: "greet.ts" });
      expect(figure).not.toHaveAttribute("aria-labelledby");
    });

    it("names the block by aria-label or aria-labelledby ahead of the title, as with a header", () => {
      const { rerender } = render(<CodeBlock code="a" title="greet.ts" aria-label="Greeting" showHeader={false} />);
      expect(screen.getByRole("figure", { name: "Greeting" })).toBeInTheDocument();
      rerender(
        <>
          <span id="label">Own name</span>
          <CodeBlock code="a" title="greet.ts" aria-labelledby="label" showHeader={false} />
        </>,
      );
      expect(screen.getByRole("figure", { name: "Own name" })).toBeInTheDocument();
      // The hidden title is a name of last resort: it is not also set when something else names the block.
      expect(screen.getByRole("figure")).not.toHaveAttribute("aria-label");
    });

    it("names the scrolling region by the title too, and by a default with no title", () => {
      scrolling();
      const { rerender } = render(<CodeBlock code={source} title="greet.ts" showHeader={false} />);
      expect(screen.getByRole("region", { name: "greet.ts" })).toBeInTheDocument();
      rerender(<CodeBlock code={source} showHeader={false} />);
      expect(screen.getByRole("region", { name: "Code" })).toBeInTheDocument();
    });

    it("collapses to the first lines below the space the buttons take, not through it", () => {
      render(<CodeBlock code={longSource} showHeader={false} collapsible collapsedLines={3} />);
      expect(screen.getByRole("button", { name: "Show 27 more lines" })).toBeInTheDocument();
      expect(document.querySelectorAll("span[data-line]")).toHaveLength(30);
    });

    it("has no accessibility violations, with the buttons or without", async () => {
      for (const props of [{ wrapToggle: true }, { copyable: false }, { title: "x.ts" }]) {
        const { container, unmount } = render(<CodeBlock code="a" showHeader={false} {...props} />);
        expect(await axe(container)).toHaveNoViolations();
        unmount();
      }
    });
  });
});

describe("CodeBlock: diff line numbers", () => {
  const diff = [
    "diff --git a/total.ts b/total.ts",
    "--- a/total.ts",
    "+++ b/total.ts",
    "@@ -8,3 +8,4 @@ export function total() {",
    "   const a = 1;",
    "-  return a;",
    "+  const b = 2;",
    "+  return a + b;",
    " }",
  ].join("\n");
  const handWritten = "- const size = 'md';\n+ const size = 'lg';";
  const lineNumbers = () => [...document.querySelectorAll("span[data-line]")].map((line) => line.getAttribute("data-numbers"));

  it("numbers a diff with hunk headers in an old and a new column, from the headers", () => {
    render(<CodeBlock code={diff} language="diff" showLineNumbers />);
    expect(screen.getByRole("figure")).toHaveClass(styles.numbered as string, styles.diffNumbered as string);
    // Two digits a column (the largest number is 11), two spaces between: six characters a row.
    expect(lineNumbers()).toEqual([
      "      ", // diff --git
      "      ", // ---
      "      ", // +++
      "      ", // @@ -8,3 +8,4 @@
      " 8   8", // context: old 8, new 8
      " 9    ", // removed: old 9
      "     9", // added: new 9
      "    10", // added: new 10
      "10  11", // context: old 10, new 11
    ]);
  });

  it("sizes the gutter for two columns and the space between them", () => {
    render(<CodeBlock code={diff} language="diff" showLineNumbers />);
    // Two digits a column: 2 + 2 + 2.
    expect(screen.getByRole("figure").style.getPropertyValue("--code-block-gutter")).toBe("6ch");
  });

  it("keeps the numbers out of the text, and the copy button copies the code as written", async () => {
    render(<CodeBlock code={diff} language="diff" showLineNumbers />);
    expect(codeElement().textContent).toBe(diff.replace(/\n/g, ""));
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(diff));
  });

  it("counts rows from 1 for highlightLines and ignores startLine in a numbered diff", () => {
    render(<CodeBlock code={diff} language="diff" showLineNumbers startLine={50} highlightLines={[6, "8-9"]} />);
    const lines = [...document.querySelectorAll("span[data-line]")];
    expect(lines.map((line) => line.getAttribute("data-line"))).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    expect(lines.filter((line) => line.getAttribute("data-highlighted") === "true").map((line) => line.getAttribute("data-line"))).toEqual(["6", "8", "9"]);
    expect(screen.getByText("Highlighted line:")).toBeInTheDocument();
    expect(screen.getByText("2 highlighted lines:")).toBeInTheDocument();
  });

  it("draws a diff with no hunk headers without a gutter, whatever showLineNumbers says", () => {
    render(<CodeBlock code={handWritten} language="diff" showLineNumbers />);
    expect(screen.getByRole("figure")).not.toHaveClass(styles.numbered as string);
    expect(screen.getByRole("figure")).not.toHaveClass(styles.diffNumbered as string);
    expect(lineNumbers()).toEqual([null, null]);
  });

  it("leaves startLine and highlightLines alone on a diff it does not number", () => {
    render(<CodeBlock code={handWritten} language="diff" showLineNumbers startLine={5} highlightLines={[5]} />);
    const lines = [...document.querySelectorAll("span[data-line]")];
    expect(lines.map((line) => line.getAttribute("data-line"))).toEqual(["5", "6"]);
    expect(lines[0]).toHaveAttribute("data-highlighted", "true");
  });

  it("draws no numbers unless showLineNumbers is on", () => {
    render(<CodeBlock code={diff} language="diff" />);
    expect(screen.getByRole("figure")).not.toHaveClass(styles.numbered as string);
    expect(lineNumbers().every((value) => value === null)).toBe(true);
  });

  it("numbers a diff written under another name for it, and leaves other languages counting their rows", () => {
    const { rerender } = render(<CodeBlock code={diff} language="patch" showLineNumbers />);
    expect(screen.getByRole("figure")).toHaveClass(styles.diffNumbered as string);
    rerender(<CodeBlock code={diff} language="ts" showLineNumbers />);
    expect(screen.getByRole("figure")).toHaveClass(styles.numbered as string);
    expect(screen.getByRole("figure")).not.toHaveClass(styles.diffNumbered as string);
    expect(lineNumbers().every((value) => value === null)).toBe(true);
    expect(document.querySelectorAll("span[data-line]")[0]).toHaveAttribute("data-line", "1");
  });

  it("numbers again from the new code when it changes", () => {
    const { rerender } = render(<CodeBlock code={handWritten} language="diff" showLineNumbers />);
    expect(screen.getByRole("figure")).not.toHaveClass(styles.diffNumbered as string);
    rerender(<CodeBlock code={diff} language="diff" showLineNumbers />);
    expect(screen.getByRole("figure")).toHaveClass(styles.diffNumbered as string);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<CodeBlock code={diff} language="diff" showLineNumbers title="total.diff" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CodeBlock: the language label", () => {
  const cleanup: Array<() => void> = [];
  afterEach(() => {
    while (cleanup.length) cleanup.pop()?.();
  });
  const label = (name: string) => screen.getByText(name);

  it("shows a built-in language by its name, as the name is written", () => {
    const cases: Array<[string, string]> = [
      ["ts", "TypeScript"], ["typescript", "TypeScript"], ["tsx", "TSX"], ["js", "JavaScript"], ["jsx", "JSX"], ["json", "JSON"],
      ["css", "CSS"], ["html", "HTML"], ["svg", "SVG"], ["xml", "XML"], ["scss", "SCSS"], ["bash", "Bash"], ["sh", "Shell"], ["diff", "Diff"], ["patch", "Diff"],
    ];
    for (const [language, name] of cases) {
      const { unmount } = render(<CodeBlock code="a" language={language} />);
      expect(label(name), language).not.toHaveClass(styles.languageRaw as string);
      unmount();
    }
  });

  it("shows a name it does not know as it was written, in the raw style, and keeps data-language as written", () => {
    render(<CodeBlock code="a" language="cobol" />);
    expect(label("cobol")).toHaveClass(styles.languageRaw as string);
    expect(screen.getByRole("figure")).toHaveAttribute("data-language", "cobol");
  });

  it("keeps data-language as written when it shows a friendly name", () => {
    render(<CodeBlock code="a" language="TS" />);
    expect(label("TypeScript")).toBeInTheDocument();
    expect(screen.getByRole("figure")).toHaveAttribute("data-language", "TS");
  });

  it("shows an opt-in language as it was written until it is registered, and by its name after", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<CodeBlock code="a" language="cs" />);
    expect(label("cs")).toHaveClass(styles.languageRaw as string);
    act(() => void cleanup.push(registerCodeLanguage(csharpLanguage)));
    expect(label("C#")).not.toHaveClass(styles.languageRaw as string);
  });

  it("takes an app's own language's label, ahead of a built-in name, and trims it", () => {
    cleanup.push(registerCodeLanguage({ name: "ts", label: "  Typed JS ", tokenize: (code) => [[{ text: code }]] }));
    render(<CodeBlock code="a" language="ts" />);
    expect(label("Typed JS")).toBeInTheDocument();
  });

  it("falls back to the built-in name, then to what was written, when a registered language has no usable label", () => {
    cleanup.push(registerCodeLanguage({ name: "ts", tokenize: (code) => [[{ text: code }]] }));
    cleanup.push(registerCodeLanguage({ name: "mine", label: 5 as never, tokenize: (code) => [[{ text: code }]] }));
    cleanup.push(registerCodeLanguage({ name: "blank", label: "   ", tokenize: (code) => [[{ text: code }]] }));
    const { rerender } = render(<CodeBlock code="a" language="ts" />);
    expect(label("TypeScript")).toBeInTheDocument();
    rerender(<CodeBlock code="a" language="mine" />);
    expect(label("mine")).toHaveClass(styles.languageRaw as string);
    rerender(<CodeBlock code="a" language="blank" />);
    expect(label("blank")).toHaveClass(styles.languageRaw as string);
  });

  it("says nothing when the language is hidden, and has no label for a value that is not a string", () => {
    const { rerender } = render(<CodeBlock code="a" language="ts" showLanguage={false} />);
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
    rerender(<CodeBlock code="a" language={5 as never} title="x" />);
    expect(document.querySelector("figcaption")).toBeInTheDocument();
  });
});

