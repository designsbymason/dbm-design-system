import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./Textarea";
import styles from "./Textarea.module.css";

const hasClearClass = styles.hasClear as string;

describe("Textarea", () => {
  it("renders a native textarea and accepts typed input", async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Comment" />);
    const textarea = screen.getByPlaceholderText("Comment");
    await user.type(textarea, "hello");
    expect(textarea).toHaveValue("hello");
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<Textarea hasError placeholder="Comment" />);
    expect(screen.getByPlaceholderText("Comment")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("does not set aria-invalid by default", () => {
    render(<Textarea placeholder="Comment" />);
    expect(screen.getByPlaceholderText("Comment")).not.toHaveAttribute(
      "aria-invalid",
    );
  });

  it("never lets a same-named consumer prop override the computed aria-invalid (found in review — TypeScript's JSX checker allows aria-* props through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(<Textarea hasError aria-invalid={false} placeholder="Comment" />);
    expect(screen.getByPlaceholderText("Comment")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("defaults to 3 rows", () => {
    render(<Textarea placeholder="Comment" />);
    expect(screen.getByPlaceholderText("Comment")).toHaveAttribute(
      "rows",
      "3",
    );
  });

  it("allows overriding rows", () => {
    render(<Textarea rows={8} placeholder="Comment" />);
    expect(screen.getByPlaceholderText("Comment")).toHaveAttribute(
      "rows",
      "8",
    );
  });

  it("applies size as a token-driven font-size/padding on the wrapper", () => {
    render(<Textarea size="lg" placeholder="Comment" />);
    const wrapper = screen.getByPlaceholderText("Comment").parentElement;
    expect(wrapper).toHaveStyle({
      fontSize: "var(--dbm-font-size-md)",
      paddingBlock: "var(--dbm-space-2)",
      paddingInline: "var(--dbm-space-4)",
    });
  });

  it("disables the native textarea when disabled", () => {
    render(<Textarea disabled placeholder="Comment" />);
    expect(screen.getByPlaceholderText("Comment")).toBeDisabled();
  });

  it("forwards ref to the native textarea, not the wrapper", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} placeholder="Comment" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current?.placeholder).toBe("Comment");
  });

  it("applies className to the wrapper, not the native textarea", () => {
    render(<Textarea className="custom" placeholder="Comment" />);
    const textarea = screen.getByPlaceholderText("Comment");
    expect(textarea).not.toHaveClass("custom");
    expect(textarea.parentElement).toHaveClass("custom");
  });

  it("applies style to the wrapper, not the native textarea (matches className's own target, found in review)", () => {
    render(
      <Textarea style={{ marginTop: "10px" }} placeholder="Comment" />,
    );
    const textarea = screen.getByPlaceholderText("Comment");
    expect(textarea).not.toHaveStyle({ marginTop: "10px" });
    expect(textarea.parentElement).toHaveStyle({ marginTop: "10px" });
  });

  it("does not let a consumer's style prop clobber the computed resize style (found in review — style previously fell through to the native textarea and completely replaced the computed { resize } object instead of being ignored by it)", () => {
    render(
      <Textarea
        style={{ marginTop: "10px" }}
        resize="both"
        placeholder="Comment"
      />,
    );
    expect(screen.getByPlaceholderText("Comment")).toHaveStyle({
      resize: "both",
    });
  });

  it("forwards native textarea props", () => {
    render(<Textarea placeholder="Comment" maxLength={10} name="bio" />);
    const textarea = screen.getByPlaceholderText("Comment");
    expect(textarea).toHaveAttribute("maxlength", "10");
    expect(textarea).toHaveAttribute("name", "bio");
  });

  describe("resize", () => {
    it("sets the native resize style from the resize prop", () => {
      render(<Textarea resize="none" placeholder="Comment" />);
      expect(screen.getByPlaceholderText("Comment")).toHaveStyle({
        resize: "none",
      });
    });

    it("defaults to vertical resize", () => {
      render(<Textarea placeholder="Comment" />);
      expect(screen.getByPlaceholderText("Comment")).toHaveStyle({
        resize: "vertical",
      });
    });

    it("forces resize to none when autoResize is enabled, regardless of the resize prop", () => {
      render(
        <Textarea autoResize resize="both" placeholder="Comment" />,
      );
      expect(screen.getByPlaceholderText("Comment")).toHaveStyle({
        resize: "none",
      });
    });
  });

  describe("autoResize", () => {
    it("grows the textarea's inline height to match its scrollHeight as content changes", async () => {
      const user = userEvent.setup();
      render(<Textarea autoResize placeholder="Comment" />);
      const textarea = screen.getByPlaceholderText(
        "Comment",
      ) as HTMLTextAreaElement;

      Object.defineProperty(textarea, "scrollHeight", {
        configurable: true,
        value: 120,
      });
      await user.type(textarea, "a");
      expect(textarea.style.height).toBe("120px");
    });

    it("does not set an inline height when autoResize is false", async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Comment" />);
      const textarea = screen.getByPlaceholderText(
        "Comment",
      ) as HTMLTextAreaElement;
      Object.defineProperty(textarea, "scrollHeight", {
        configurable: true,
        value: 120,
      });
      await user.type(textarea, "a");
      expect(textarea.style.height).toBe("");
    });

    // jsdom doesn't resolve CSS custom properties (`var()`) via
    // `getComputedStyle`, so the real `--dbm-*`-token-driven line-height/
    // padding this component actually renders with can't be read
    // reliably here the way a real browser resolves them — set them
    // directly as inline styles on the textarea instead (which jsdom's
    // `getComputedStyle` does correctly reflect) to make the
    // minRows/maxRows→pixel math below deterministic. The real, live
    // clamping behavior (actual token-driven metrics, real layout) is
    // covered separately by this component's own Storybook interaction
    // stories, run in a real browser via `@storybook/addon-vitest`.
    const setDeterministicMetrics = (textarea: HTMLTextAreaElement) => {
      textarea.style.lineHeight = "20px";
      textarea.style.paddingTop = "10px";
      textarea.style.paddingBottom = "10px";
    };

    describe("minRows/maxRows", () => {
      it("clamps the height up to minRows worth of pixels when content is shorter", async () => {
        const user = userEvent.setup();
        render(<Textarea autoResize minRows={3} placeholder="Comment" />);
        const textarea = screen.getByPlaceholderText(
          "Comment",
        ) as HTMLTextAreaElement;
        setDeterministicMetrics(textarea);
        Object.defineProperty(textarea, "scrollHeight", {
          configurable: true,
          value: 20,
        });
        await user.type(textarea, "a");
        // 3 rows × 20px line-height + 20px padding = 80px, taller than
        // the faked 20px natural scrollHeight.
        expect(textarea.style.height).toBe("80px");
      });

      it("clamps the height down to maxRows worth of pixels and enables internal scrolling when content is longer", async () => {
        const user = userEvent.setup();
        render(<Textarea autoResize maxRows={4} placeholder="Comment" />);
        const textarea = screen.getByPlaceholderText(
          "Comment",
        ) as HTMLTextAreaElement;
        setDeterministicMetrics(textarea);
        Object.defineProperty(textarea, "scrollHeight", {
          configurable: true,
          value: 500,
        });
        await user.type(textarea, "a");
        // 4 rows × 20px line-height + 20px padding = 100px, shorter than
        // the faked 500px natural scrollHeight.
        expect(textarea.style.height).toBe("100px");
        expect(textarea.style.overflowY).toBe("auto");
      });

      it("does not clamp height or force scrolling when content fits within maxRows", async () => {
        const user = userEvent.setup();
        render(<Textarea autoResize maxRows={10} placeholder="Comment" />);
        const textarea = screen.getByPlaceholderText(
          "Comment",
        ) as HTMLTextAreaElement;
        setDeterministicMetrics(textarea);
        Object.defineProperty(textarea, "scrollHeight", {
          configurable: true,
          value: 60,
        });
        await user.type(textarea, "a");
        expect(textarea.style.height).toBe("60px");
        expect(textarea.style.overflowY).toBe("hidden");
      });

      it("has no effect when autoResize is false", async () => {
        const user = userEvent.setup();
        render(
          <Textarea minRows={3} maxRows={5} placeholder="Comment" />,
        );
        const textarea = screen.getByPlaceholderText(
          "Comment",
        ) as HTMLTextAreaElement;
        Object.defineProperty(textarea, "scrollHeight", {
          configurable: true,
          value: 120,
        });
        await user.type(textarea, "a");
        expect(textarea.style.height).toBe("");
      });

      it("warns once in development when minRows/maxRows are provided without autoResize", () => {
        const consoleWarnSpy = vi
          .spyOn(console, "warn")
          .mockImplementation(() => {});
        const { rerender } = render(
          <Textarea minRows={3} placeholder="Comment" />,
        );
        rerender(<Textarea minRows={4} placeholder="Comment" />);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("have no effect here"),
        );
        consoleWarnSpy.mockRestore();
      });

      it("does not warn when minRows/maxRows are paired with autoResize", () => {
        const consoleWarnSpy = vi
          .spyOn(console, "warn")
          .mockImplementation(() => {});
        render(
          <Textarea
            autoResize
            minRows={3}
            maxRows={8}
            placeholder="Comment"
          />,
        );

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
      });

      it("warns once in development when minRows is greater than maxRows", () => {
        const consoleWarnSpy = vi
          .spyOn(console, "warn")
          .mockImplementation(() => {});
        const { rerender } = render(
          <Textarea
            autoResize
            minRows={8}
            maxRows={3}
            placeholder="Comment"
          />,
        );
        rerender(
          <Textarea
            autoResize
            minRows={9}
            maxRows={3}
            placeholder="Comment"
          />,
        );

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("is greater than"),
        );
        consoleWarnSpy.mockRestore();
      });

      it("does not warn when minRows is less than or equal to maxRows", () => {
        const consoleWarnSpy = vi
          .spyOn(console, "warn")
          .mockImplementation(() => {});
        render(
          <Textarea
            autoResize
            minRows={3}
            maxRows={3}
            placeholder="Comment"
          />,
        );

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
      });
    });
  });

  describe("showCount", () => {
    it("does not render a count when showCount is false", () => {
      render(<Textarea maxLength={100} placeholder="Comment" />);
      expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
    });

    it("does not render a count when maxLength is not set, even if showCount is true", () => {
      render(<Textarea showCount placeholder="Comment" />);
      expect(screen.queryByText(/\//)).not.toBeInTheDocument();
    });

    it("shows a live current/max count as the uncontrolled value changes", async () => {
      const user = userEvent.setup();
      render(<Textarea showCount maxLength={10} placeholder="Comment" />);
      expect(screen.getByText("0/10")).toBeInTheDocument();
      await user.type(screen.getByPlaceholderText("Comment"), "hi");
      expect(screen.getByText("2/10")).toBeInTheDocument();
    });

    it("reflects a controlled value's length", () => {
      const { rerender } = render(
        <Textarea
          showCount
          maxLength={10}
          value="hello"
          onChange={vi.fn()}
          placeholder="Comment"
        />,
      );
      expect(screen.getByText("5/10")).toBeInTheDocument();

      rerender(
        <Textarea
          showCount
          maxLength={10}
          value="hello world"
          onChange={vi.fn()}
          placeholder="Comment"
        />,
      );
      expect(screen.getByText("11/10")).toBeInTheDocument();
    });
  });

  describe("onClear", () => {
    it("does not render a clear button when onClear is not provided", () => {
      render(<Textarea defaultValue="hello" placeholder="Comment" />);
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();
    });

    it("shows a clear button for a non-empty uncontrolled value and hides it once cleared by typing", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <Textarea
          defaultValue="hello"
          onClear={onClear}
          placeholder="Comment"
        />,
      );
      const textarea = screen.getByPlaceholderText("Comment");
      expect(
        screen.getByRole("button", { name: "Clear" }),
      ).toBeInTheDocument();

      await user.clear(textarea);
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();
    });

    it("does not show a clear button for an empty uncontrolled value until the user types", async () => {
      const user = userEvent.setup();
      render(<Textarea onClear={() => {}} placeholder="Comment" />);
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();

      await user.type(screen.getByPlaceholderText("Comment"), "a");
      expect(
        screen.getByRole("button", { name: "Clear" }),
      ).toBeInTheDocument();
    });

    it("calls onClear and refocuses the textarea when the clear button is clicked", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <Textarea
          defaultValue="hello"
          onClear={onClear}
          placeholder="Comment"
        />,
      );
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(screen.getByPlaceholderText("Comment")).toHaveFocus();
    });

    it("is keyboard-activatable — Enter and Space on the focused clear button both call onClear", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <Textarea
          defaultValue="hello"
          onClear={onClear}
          placeholder="Comment"
        />,
      );
      const clearButton = screen.getByRole("button", { name: "Clear" });
      clearButton.focus();
      expect(clearButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onClear).toHaveBeenCalledTimes(1);

      clearButton.focus();
      await user.keyboard(" ");
      expect(onClear).toHaveBeenCalledTimes(2);
    });

    it("tracks a controlled value directly, showing the clear button whenever value is non-empty", () => {
      function Controlled() {
        const [value, setValue] = useState("hello");
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onClear={() => setValue("")}
            placeholder="Comment"
          />
        );
      }
      render(<Controlled />);
      expect(
        screen.getByRole("button", { name: "Clear" }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Clear" }));
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();
    });

    it("reserves space on the textarea for the clear button whenever onClear is provided, regardless of whether it's currently visible", () => {
      const { rerender } = render(
        <Textarea onClear={() => {}} placeholder="Comment" />,
      );
      expect(screen.getByPlaceholderText("Comment")).toHaveClass(
        hasClearClass,
      );

      rerender(<Textarea placeholder="Comment" />);
      expect(screen.getByPlaceholderText("Comment")).not.toHaveClass(
        hasClearClass,
      );
    });
  });

  it("has no accessibility violations, plain, with an error, with a count, or with a clear button", async () => {
    const { container, rerender } = render(<Textarea aria-label="Comment" />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Textarea aria-label="Comment" hasError />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Textarea aria-label="Comment" showCount maxLength={100} />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Textarea
        aria-label="Comment"
        defaultValue="hello"
        onClear={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
