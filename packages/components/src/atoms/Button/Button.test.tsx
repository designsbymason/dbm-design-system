import { WalletIcon } from "@dbm-design-system/icons";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it('renders a native <button type="button"> by default', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("applies each variant's background/text color tokens", () => {
    const { rerender } = render(<Button variant="primary">Go</Button>);
    expect(screen.getByRole("button")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-brand)",
      color: "var(--dbm-text-on-brand)",
    });

    rerender(
      <Button variant="destructive" data-testid="btn">
        Go
      </Button>,
    );
    expect(screen.getByTestId("btn")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger)",
      color: "var(--dbm-text-on-danger)",
    });

    rerender(
      <Button variant="secondary" data-testid="btn">
        Go
      </Button>,
    );
    // No `borderColor` assertion here — jsdom's CSS parser (via
    // `cssstyle`) can't resolve a `var()` inside the `border: ... solid
    // ...` shorthand at all (confirmed directly: `borderColor` comes back
    // empty even for a literal-width `border: 1px solid var(--x)`), and
    // even the `border-color` *longhand* gets silently dropped to black
    // rather than preserving the reference — only a fully-decomposed
    // per-side `border-{top,right,bottom,left}-color` survives, which
    // isn't worth restructuring real component CSS for. Covered instead
    // by the real-browser check in `e2e/visual.spec.ts`.
    expect(screen.getByTestId("btn")).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "var(--dbm-text-brand)",
    });

    rerender(
      <Button variant="tertiary" data-testid="btn">
        Go
      </Button>,
    );
    expect(screen.getByTestId("btn")).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "var(--dbm-text-brand)",
    });

    rerender(
      <Button variant="ghost" data-testid="btn">
        Go
      </Button>,
    );
    expect(screen.getByTestId("btn")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-brand-subtle)",
      color: "var(--dbm-text-brand)",
    });
  });

  it("renders the leading/trailing icon in icon.brand for the secondary/tertiary/ghost variants", () => {
    const { rerender } = render(
      <Button variant="secondary" leadingIcon={WalletIcon}>
        Go
      </Button>,
    );
    expect(screen.getByRole("button").querySelector("svg")).toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });

    rerender(
      <Button variant="tertiary" leadingIcon={WalletIcon}>
        Go
      </Button>,
    );
    expect(screen.getByRole("button").querySelector("svg")).toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });

    rerender(
      <Button variant="ghost" leadingIcon={WalletIcon}>
        Go
      </Button>,
    );
    expect(screen.getByRole("button").querySelector("svg")).toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });
  });

  it("applies each size's padding/font-size tokens", () => {
    render(
      <Button size="xl" data-testid="btn">
        Go
      </Button>,
    );
    expect(screen.getByTestId("btn")).toHaveStyle({
      fontSize: "var(--dbm-font-size-lg)",
      paddingBlock: "var(--dbm-space-4)",
      paddingInline: "var(--dbm-space-8)",
    });
  });

  it("uses the shared md radius token", () => {
    render(<Button data-testid="btn">Go</Button>);
    expect(screen.getByTestId("btn")).toHaveStyle({
      borderRadius: "var(--dbm-radius-md)",
    });
  });

  it("renders a leading icon", () => {
    render(<Button leadingIcon={WalletIcon}>Balance</Button>);
    expect(screen.getByRole("button").querySelector("svg")).toBeInTheDocument();
  });

  it("renders a trailing icon", () => {
    render(<Button trailingIcon={WalletIcon}>Balance</Button>);
    expect(screen.getByRole("button").querySelector("svg")).toBeInTheDocument();
  });

  it("shows a spinner and disables the button when isLoading", () => {
    render(<Button isLoading>Saving</Button>);
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("never lets a same-named consumer prop override the computed aria-busy (found in review — TypeScript's JSX checker allows aria-* props through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(
      <Button isLoading aria-busy={false}>
        Saving
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("hides the leading icon in favor of the spinner when isLoading", () => {
    render(
      <Button isLoading leadingIcon={WalletIcon}>
        Saving
      </Button>,
    );
    // Only the spinner span should render, not the Wallet svg.
    expect(
      screen.getByRole("button").querySelector("svg"),
    ).not.toBeInTheDocument();
  });

  it("respects an explicit disabled prop independent of isLoading", () => {
    render(<Button disabled>Go</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("stays disabled while isLoading even when disabled is explicitly false", () => {
    // Regression test: `disabled ?? isLoading` used to let an explicit
    // `disabled={false}` win over `isLoading` via `??`'s nullish-only
    // fallthrough, leaving a "loading" button fully clickable.
    render(
      <Button isLoading disabled={false}>
        Save
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" but respects an explicit type override', () => {
    const { rerender } = render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");

    rerender(<Button type="submit">Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("shows loadingText in place of children while isLoading, falling back to children otherwise", () => {
    const { rerender } = render(
      <Button isLoading loadingText="Saving…">
        Save
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Saving…" })).toBeInTheDocument();

    rerender(<Button isLoading>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("falls back to children when loadingText is explicitly an empty string, not just omitted", () => {
    // Regression test: `loadingText ?? children` used to let an explicit ""
    // win over children, since `??` only falls through on null/undefined —
    // leaving the button with no visible or accessible label while loading.
    render(
      <Button isLoading loadingText="">
        Save
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("applies fullWidth styling", () => {
    render(<Button fullWidth>Go</Button>);
    expect(screen.getByRole("button").className).toMatch(/fullWidth/);
  });

  describe("asChild disabled/isLoading", () => {
    it("applies aria-disabled and blocks the click handler on the slotted element", () => {
      const onClick = vi.fn();
      render(
        <Button asChild disabled onClick={onClick}>
          <a href="/next">Continue</a>
        </Button>,
      );
      const link = screen.getByRole("link", { name: "Continue" });
      expect(link).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(link);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("does not set aria-disabled when neither disabled nor isLoading is set", () => {
      render(
        <Button asChild>
          <a href="/next">Continue</a>
        </Button>,
      );
      expect(
        screen.getByRole("link", { name: "Continue" }),
      ).not.toHaveAttribute("aria-disabled");
    });

    it("never lets a same-named consumer prop override the computed aria-disabled (same ordering fix as aria-busy above)", () => {
      render(
        <Button asChild disabled aria-disabled={false}>
          <a href="/next">Continue</a>
        </Button>,
      );
      expect(
        screen.getByRole("link", { name: "Continue" }),
      ).toHaveAttribute("aria-disabled", "true");
    });
  });

  it("renders the single child via Slot when asChild is set, without icons", () => {
    render(
      <Button asChild leadingIcon={WalletIcon}>
        <a href="/next">Continue</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Continue" });
    expect(link.tagName).toBe("A");
    expect(link.querySelector("svg")).not.toBeInTheDocument();
  });

  it("removes the default anchor underline in asChild mode", () => {
    render(
      <Button asChild>
        <a href="/next">Continue</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Continue" })).toHaveStyle({
      textDecoration: "none",
    });
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Go</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards className and native button props", () => {
    render(
      <Button className="custom" data-testid="btn">
        Go
      </Button>,
    );
    expect(screen.getByTestId("btn")).toHaveClass("custom");
  });

  it("forwards style to the root element", () => {
    render(
      <Button style={{ marginTop: "1rem" }} data-testid="btn">
        Go
      </Button>,
    );
    expect(screen.getByTestId("btn")).toHaveStyle({ marginTop: "1rem" });
  });

  describe("dev-mode warnings", () => {
    it("warns once in development when there is no accessible name", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(<Button leadingIcon={WalletIcon} />);
      rerender(<Button leadingIcon={WalletIcon} size="lg" />);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("no accessible name"),
      );
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when children provides a visible label", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<Button leadingIcon={WalletIcon}>Balance</Button>);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when aria-label is provided instead of children", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<Button leadingIcon={WalletIcon} aria-label="Balance" />);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when isLoading provides loadingText but no children", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<Button isLoading loadingText="Saving…" />);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("warns once in development when asChild is combined with leadingIcon/trailingIcon/isLoading", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(
        <Button asChild leadingIcon={WalletIcon}>
          <a href="/next">Continue</a>
        </Button>,
      );
      rerender(
        <Button asChild leadingIcon={WalletIcon}>
          <a href="/next">Continue, still</a>
        </Button>,
      );

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("have no effect when `asChild` is set"),
      );
      consoleWarnSpy.mockRestore();
    });

    it("does not warn when asChild is used without leadingIcon/trailingIcon/isLoading", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Button asChild>
          <a href="/next">Continue</a>
        </Button>,
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  it("has no accessibility violations across variants", async () => {
    const { container, rerender } = render(<Button>Primary</Button>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Button variant="secondary">Secondary</Button>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Button variant="tertiary">Tertiary</Button>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Button variant="ghost">Ghost</Button>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Button variant="destructive">Delete</Button>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Button isLoading>Saving</Button>);
    expect((await axe(container)).violations).toHaveLength(0);

    // The `asChild` anchor is a structurally different rendered element
    // (Slot-merged onto a consumer-supplied <a>, not Button's own
    // <button>) — worth its own check rather than assuming the native-
    // button result carries over, same reasoning as checking a non-default
    // `as` value on a polymorphic component (`06-engineering-standards.md`
    // §9).
    rerender(
      <Button asChild>
        <a href="/next">Continue as a link</a>
      </Button>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
