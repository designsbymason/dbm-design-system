import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";
import styles from "./CodeBlock.module.css";

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

  it("drops one trailing newline and keeps blank lines", () => {
    render(<CodeBlock code={"a\n\nb\n"} language="text" />);
    expect(codeElement().querySelectorAll("span[data-line]")).toHaveLength(3);
  });

  describe("naming", () => {
    it("is named by its title, and shows it with the language", () => {
      render(<CodeBlock code={source} language="ts" title="greet.ts" />);
      expect(screen.getByRole("figure", { name: "greet.ts" })).toBeInTheDocument();
      expect(screen.getByText("ts")).toBeInTheDocument();
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

  describe("copying", () => {
    it("copies exactly the code and calls onCopied", async () => {
      const onCopied = vi.fn();
      render(<CodeBlock code={source} onCopied={onCopied} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(source));
      await waitFor(() => expect(onCopied).toHaveBeenCalledWith(source));
      expect(screen.getByRole("button", { name: "Copy code" })).toHaveAttribute("data-copy-state", "copied");
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
