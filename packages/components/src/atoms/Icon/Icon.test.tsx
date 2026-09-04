import { WalletIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";
import type { IconProps } from "./Icon.types";

describe("Icon", () => {
  it("renders the given Phosphor icon component", () => {
    render(<Icon icon={WalletIcon} data-testid="icon" />);
    expect(screen.getByTestId("icon").tagName.toLowerCase()).toBe("svg");
  });

  it("is hidden from the accessibility tree by default (decorative)", () => {
    render(<Icon icon={WalletIcon} data-testid="icon" />);
    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("icon")).not.toHaveAttribute("role");
  });

  it("exposes an accessible name via role=img when label is given", () => {
    render(<Icon icon={WalletIcon} label="Wallet balance" />);
    const icon = screen.getByRole("img", { name: "Wallet balance" });
    expect(icon).not.toHaveAttribute("aria-hidden");
  });

  it("does not let a same-named consumer prop override the computed role/aria-label/aria-hidden", () => {
    // Regression test for the {...props}-ordering bug class (see
    // 05-component-api-conventions.md §3) — {...props} must spread before
    // the computed role/aria-label/aria-hidden attributes, not after, or a
    // same-named consumer prop silently wins. TypeScript's own aria-*
    // exemption means a consumer can still pass these at runtime despite
    // IconProps Omitting them, so the deliberately-invalid values are
    // passed via a spread object cast through `unknown` (rather than literal
    // JSX attributes, and rather than `any`) to simulate exactly that.
    const invalidProps = {
      role: "not-img",
      "aria-label": "wrong label",
      "aria-hidden": false,
    } as unknown as IconProps;
    render(
      <Icon {...invalidProps} icon={WalletIcon} label="Wallet balance" data-testid="icon" />,
    );
    const el = screen.getByTestId("icon");
    expect(el).toHaveAttribute("role", "img");
    expect(el).toHaveAttribute("aria-label", "Wallet balance");
    expect(el).not.toHaveAttribute("aria-hidden");
  });

  it("applies size as a token-driven width/height", () => {
    render(<Icon icon={WalletIcon} size="lg" data-testid="icon" />);
    expect(screen.getByTestId("icon")).toHaveStyle({
      width: "var(--dbm-icon-size-lg)",
      height: "var(--dbm-icon-size-lg)",
    });
  });

  it("defaults to size=md", () => {
    render(<Icon icon={WalletIcon} data-testid="icon" />);
    expect(screen.getByTestId("icon")).toHaveStyle({
      width: "var(--dbm-icon-size-md)",
      height: "var(--dbm-icon-size-md)",
    });
  });

  it("passes weight through to the underlying icon, changing the rendered path", () => {
    const { container: thin } = render(
      <Icon icon={WalletIcon} weight="thin" />,
    );
    const { container: bold } = render(
      <Icon icon={WalletIcon} weight="bold" />,
    );
    expect(thin.querySelector("svg")?.innerHTML).not.toBe(
      bold.querySelector("svg")?.innerHTML,
    );
  });

  it("defaults weight to bold", () => {
    const { container: defaulted } = render(<Icon icon={WalletIcon} />);
    const { container: explicit } = render(
      <Icon icon={WalletIcon} weight="bold" />,
    );
    expect(defaulted.querySelector("svg")?.innerHTML).toBe(
      explicit.querySelector("svg")?.innerHTML,
    );
  });

  it("applies tone as a token-driven color, and inherits currentColor when omitted", () => {
    const { rerender } = render(
      <Icon icon={WalletIcon} tone="brand" data-testid="icon" />,
    );
    expect(screen.getByTestId("icon")).toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });

    rerender(<Icon icon={WalletIcon} data-testid="icon" />);
    expect(screen.getByTestId("icon")).not.toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });
  });

  it("applies mirrored as a horizontal flip transform", () => {
    render(<Icon icon={WalletIcon} mirrored data-testid="icon" />);
    expect(screen.getByTestId("icon")).toHaveAttribute(
      "transform",
      "scale(-1, 1)",
    );
  });

  it("does not mirror by default", () => {
    render(<Icon icon={WalletIcon} data-testid="icon" />);
    expect(screen.getByTestId("icon")).not.toHaveAttribute("transform");
  });

  it("forwards id and data-testid", () => {
    render(<Icon icon={WalletIcon} id="my-icon" data-testid="icon" />);
    expect(screen.getByTestId("icon")).toHaveAttribute("id", "my-icon");
  });

  it("forwards ref to the underlying svg", () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon icon={WalletIcon} ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it("forwards className and native svg props", () => {
    render(<Icon icon={WalletIcon} className="custom" data-testid="icon" />);
    expect(screen.getByTestId("icon")).toHaveClass("custom");
  });

  it("has no accessibility violations, decorative or labeled", async () => {
    const { container, rerender } = render(<Icon icon={WalletIcon} />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Icon icon={WalletIcon} label="Wallet" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
