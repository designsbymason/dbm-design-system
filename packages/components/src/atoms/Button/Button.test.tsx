import { WalletIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
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
      paddingInline: "var(--dbm-space-6)",
    });
  });

  it("renders a leading icon", () => {
    render(<Button icon={WalletIcon}>Balance</Button>);
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

  it("hides the leading icon in favor of the spinner when isLoading", () => {
    render(
      <Button isLoading icon={WalletIcon}>
        Saving
      </Button>,
    );
    // Only the spinner span should render, not the Wallet svg.
    expect(screen.getByRole("button").querySelector("svg")).not.toBeInTheDocument();
  });

  it("respects an explicit disabled prop independent of isLoading", () => {
    render(<Button disabled>Go</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders the single child via Slot when asChild is set, without icons", () => {
    render(
      <Button asChild icon={WalletIcon}>
        <a href="/next">Continue</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Continue" });
    expect(link.tagName).toBe("A");
    expect(link.querySelector("svg")).not.toBeInTheDocument();
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

  it("has no accessibility violations across variants", async () => {
    const { container, rerender } = render(<Button>Primary</Button>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Button variant="destructive">Delete</Button>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Button isLoading>Saving</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
