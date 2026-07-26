import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./Textarea";

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

  it("has no accessibility violations, plain, with an error, or with a count", async () => {
    const { container, rerender } = render(<Textarea aria-label="Comment" />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Textarea aria-label="Comment" hasError />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Textarea aria-label="Comment" showCount maxLength={100} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
