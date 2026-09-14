import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("renders a native search input", () => {
    render(<SearchInput aria-label="Search" />);
    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveAttribute(
      "type",
      "search",
    );
  });

  it("starts at defaultValue when uncontrolled", () => {
    render(<SearchInput aria-label="Search" defaultValue="hello" />);
    expect(screen.getByRole("searchbox")).toHaveValue("hello");
  });

  it("calls onChange immediately on every keystroke", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput aria-label="Search" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "hi");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("debounces onSearch, firing once after the value settles", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<SearchInput aria-label="Search" onSearch={onSearch} />);
    const input = screen.getByRole("searchbox");

    fireEvent.change(input, { target: { value: "h" } });
    fireEvent.change(input, { target: { value: "he" } });
    fireEvent.change(input, { target: { value: "hel" } });
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(onSearch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("hel");

    vi.useRealTimers();
  });

  it("respects a custom debounceMs", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(
      <SearchInput aria-label="Search" onSearch={onSearch} debounceMs={1000} />,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "x" } });
    vi.advanceTimersByTime(500);
    expect(onSearch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onSearch).toHaveBeenCalledWith("x");
    vi.useRealTimers();
  });

  it("fires onSearch on every keystroke with no debounce when debounceMs is 0", () => {
    const onSearch = vi.fn();
    render(
      <SearchInput aria-label="Search" onSearch={onSearch} debounceMs={0} />,
    );
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    expect(onSearch).toHaveBeenCalledTimes(2);
    expect(onSearch).toHaveBeenLastCalledWith("ab");
  });

  it("fires onSearch immediately on Enter, cancelling rather than merely pre-empting a pending debounce", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<SearchInput aria-label="Search" onSearch={onSearch} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "cats" } });
    expect(onSearch).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("cats");

    // The pending debounce was cancelled, not just pre-empted — advancing
    // past its own delay doesn't fire a second, stale call.
    vi.advanceTimersByTime(400);
    expect(onSearch).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  describe("onClear", () => {
    it("does not render a clear button when onClear is not provided", () => {
      render(<SearchInput aria-label="Search" defaultValue="hello" />);
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();
    });

    it("shows a clear button once there's a value; clicking it clears the value, calls onClear, refocuses the input, and fires onSearch immediately with an empty string", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      const onSearch = vi.fn();
      render(
        <SearchInput
          aria-label="Search"
          defaultValue="hello"
          onClear={onClear}
          onSearch={onSearch}
        />,
      );
      const input = screen.getByRole("searchbox");
      await user.click(screen.getByRole("button", { name: "Clear" }));

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("");
      expect(input).toHaveValue("");
      expect(input).toHaveFocus();
    });

    it("clears via the Escape key when there's a value, and stops the key event from bubbling further", () => {
      const onClear = vi.fn();
      const onSearch = vi.fn();
      const onKeyDownCaught = vi.fn();
      render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- test-only wrapper asserting the key event doesn't bubble past this point, not a real interactive element.
        <div onKeyDown={onKeyDownCaught}>
          <SearchInput
            aria-label="Search"
            defaultValue="hello"
            onClear={onClear}
            onSearch={onSearch}
          />
        </div>,
      );
      fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("searchbox")).toHaveValue("");
      expect(onSearch).toHaveBeenCalledWith("");
      expect(onKeyDownCaught).not.toHaveBeenCalled();
    });

    it("does nothing on Escape when the field is already empty", () => {
      const onClear = vi.fn();
      render(<SearchInput aria-label="Search" onClear={onClear} />);
      fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
      expect(onClear).not.toHaveBeenCalled();
    });

    it("does nothing on Escape when onClear isn't provided", () => {
      render(<SearchInput aria-label="Search" defaultValue="hello" />);
      fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
      expect(screen.getByRole("searchbox")).toHaveValue("hello");
    });

    it("clears a controlled value by calling onClear — the caller updates value, same contract as Input's/NumberInput's own onClear", () => {
      function Controlled() {
        const [value, setValue] = useState("hello");
        return (
          <SearchInput
            aria-label="Search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onClear={() => setValue("")}
          />
        );
      }
      render(<Controlled />);
      fireEvent.click(screen.getByRole("button", { name: "Clear" }));
      expect(screen.getByRole("searchbox")).toHaveValue("");
    });

    it("disables the clear button (via Input's own fix) when disabled or readOnly", () => {
      const { rerender } = render(
        <SearchInput
          aria-label="Search"
          defaultValue="hello"
          onClear={() => {}}
          disabled
        />,
      );
      expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();

      rerender(
        <SearchInput
          aria-label="Search"
          defaultValue="hello"
          onClear={() => {}}
          readOnly
        />,
      );
      expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    });
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <SearchInput
          aria-label="Search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
    render(<Controlled />);
    await user.type(screen.getByRole("searchbox"), "hi");
    expect(screen.getByRole("searchbox")).toHaveValue("hi");
  });

  it("renders the search icon by default and swaps it for a spinner when isLoading", () => {
    const { container, rerender } = render(<SearchInput aria-label="Search" />);
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<SearchInput aria-label="Search" isLoading />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("disables the native input when disabled", () => {
    render(<SearchInput aria-label="Search" disabled />);
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<SearchInput aria-label="Search" hasError />);
    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("forwards ref to the native input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchInput aria-label="Search" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute("type", "search");
  });

  it("forwards native input props", () => {
    render(<SearchInput aria-label="Search" maxLength={10} placeholder="Search…" />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("maxlength", "10");
    expect(input).toHaveAttribute("placeholder", "Search…");
  });

  it("renders a suffix", () => {
    render(<SearchInput aria-label="Search" suffix={<span>⌘K</span>} />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("cleans up a pending debounce timer on unmount without a late call", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { unmount } = render(
      <SearchInput aria-label="Search" onSearch={onSearch} />,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "x" } });
    unmount();
    expect(() => vi.advanceTimersByTime(500)).not.toThrow();
    expect(onSearch).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("has no accessibility violations, default, loading, with an error, or disabled", async () => {
    const { container: defaultContainer } = render(
      <SearchInput aria-label="Search" />,
    );
    expect((await axe(defaultContainer)).violations).toHaveLength(0);

    const { container: loadingContainer } = render(
      <SearchInput aria-label="Search" isLoading />,
    );
    expect((await axe(loadingContainer)).violations).toHaveLength(0);

    const { container: errorContainer } = render(
      <SearchInput aria-label="Search" hasError />,
    );
    expect((await axe(errorContainer)).violations).toHaveLength(0);

    const { container: disabledContainer } = render(
      <SearchInput aria-label="Search" disabled />,
    );
    expect((await axe(disabledContainer)).violations).toHaveLength(0);
  });
});
