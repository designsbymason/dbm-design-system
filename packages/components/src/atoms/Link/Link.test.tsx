import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Link } from "./Link";

describe("Link", () => {
  it("renders an anchor with the given href", () => {
    render(<Link href="/docs">Docs</Link>);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
  });

  it("does not treat a relative href as external", () => {
    render(<Link href="/docs">Docs</Link>);
    const link = screen.getByRole("link");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("auto-detects an absolute http(s) href as external", () => {
    render(<Link href="https://example.com">External</Link>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("auto-detects a protocol-relative href (//...) as external", () => {
    render(<Link href="//example.com">Protocol-relative</Link>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("respects an explicit `external` override", () => {
    render(
      <Link href="/internal-but-forced-external" external>
        Forced
      </Link>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("respects an explicit `target`/`rel` override even when external", () => {
    render(
      <Link href="https://example.com" target="_self" rel="nofollow">
        Custom target/rel
      </Link>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_self");
    expect(link).toHaveAttribute("rel", "nofollow");
  });

  it("renders the external-link icon only when external", () => {
    const { rerender } = render(<Link href="/docs">Docs</Link>);
    expect(document.querySelector("svg")).not.toBeInTheDocument();

    rerender(<Link href="https://example.com">External</Link>);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("adds a visually-hidden \"opens in a new tab\" cue only when external", () => {
    const { rerender } = render(<Link href="/docs">Docs</Link>);
    expect(screen.queryByText(/opens in a new tab/)).not.toBeInTheDocument();

    rerender(<Link href="https://example.com">External</Link>);
    expect(screen.getByText(/opens in a new tab/)).toBeInTheDocument();
  });

  it("underlines by default", () => {
    render(<Link href="/docs" data-testid="link">Docs</Link>);
    expect(screen.getByTestId("link").className).toMatch(/underlineAlways/);
  });

  it("applies the hover-only underline variant", () => {
    render(
      <Link href="/docs" underline="hover" data-testid="link">
        Docs
      </Link>,
    );
    expect(screen.getByTestId("link").className).toMatch(/underlineHover/);
  });

  it("applies the no-underline variant", () => {
    render(
      <Link href="/docs" underline="none" data-testid="link">
        Docs
      </Link>,
    );
    expect(screen.getByTestId("link").className).toMatch(/underlineNone/);
  });

  it("renders the single child via Slot when asChild is set, merging href onto a real anchor, without the icon", () => {
    render(
      <Link asChild href="https://example.com" external>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- intentionally
        no literal href; this test verifies Slot merges Link's own href onto
        the child at render time. */}
        <a>Custom element</a>
      </Link>,
    );
    const el = screen.getByRole("link", { name: "Custom element" });
    expect(el.tagName).toBe("A");
    expect(el).toHaveAttribute("href", "https://example.com");
    expect(document.querySelector("svg")).not.toBeInTheDocument();
  });

  it("forwards ref to the underlying anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="/docs">
        Docs
      </Link>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("forwards className and native props", () => {
    render(
      <Link href="/docs" className="custom" data-testid="link">
        Docs
      </Link>,
    );
    expect(screen.getByTestId("link")).toHaveClass("custom");
  });

  it("applies style, id, and data-testid", () => {
    render(
      <Link href="/docs" style={{ fontWeight: 700 }} id="my-link" data-testid="link-1">
        Docs
      </Link>,
    );
    const el = screen.getByTestId("link-1");
    expect(el).toHaveStyle({ fontWeight: "700" });
    expect(el.id).toBe("my-link");
  });

  it("applies download", () => {
    render(
      <Link href="/report.pdf" download="annual-report.pdf">
        Download report
      </Link>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("download", "annual-report.pdf");
  });

  it("applies aria-label for content that isn't readable text on its own", () => {
    render(<Link href="/docs" aria-label="Read the documentation" />);
    expect(screen.getByRole("link", { name: "Read the documentation" })).toBeInTheDocument();
  });

  describe("disabled", () => {
    it("is not disabled by default", () => {
      render(<Link href="/docs">Docs</Link>);
      expect(screen.getByRole("link")).not.toHaveAttribute("aria-disabled");
    });

    it("applies aria-disabled without removing the link from the tab order", () => {
      render(
        <Link href="/docs" disabled>
          Docs
        </Link>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-disabled", "true");
      expect(link).not.toHaveAttribute("tabindex", "-1");
      expect(link).toHaveAttribute("href", "/docs");
    });

    it("blocks the click handler and default navigation when disabled", () => {
      const handleClick = vi.fn();
      render(
        <Link href="/docs" disabled onClick={handleClick}>
          Docs
        </Link>,
      );
      const link = screen.getByRole("link");
      const event = fireEvent.click(link);
      expect(handleClick).not.toHaveBeenCalled();
      expect(event).toBe(false); // fireEvent.click returns false when preventDefault() was called
    });

    it("still fires the click handler when not disabled", () => {
      const handleClick = vi.fn();
      render(
        <Link href="/docs" onClick={handleClick}>
          Docs
        </Link>,
      );
      fireEvent.click(screen.getByRole("link"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("blocks the click handler in asChild mode too", () => {
      const handleClick = vi.fn();
      render(
        <Link asChild href="/docs" disabled onClick={handleClick}>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- same
          reasoning as the other asChild tests: Link's own href is merged
          onto this anchor at render time. */}
          <a>Docs</a>
        </Link>,
      );
      fireEvent.click(screen.getByRole("link"));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("blocks a click handler declared directly on the asChild child, not just one passed to Link itself", () => {
      // Regression test: Radix Slot composes bubble-phase onClick handlers
      // with the slotted child's own handler running first, then Link's —
      // a bubble-phase guard let this fire even when disabled (confirmed
      // empirically before switching Link's guard to onClickCapture, which
      // runs before any bubble-phase handler regardless of composition
      // order).
      const childOnClick = vi.fn();
      render(
        <Link asChild href="/docs" disabled>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- same reasoning as the other asChild tests: this anchor gets a real href merged onto it via Slot at render time, so it's a genuine, keyboard-operable link once rendered even though it has none (and looks like a static/button-like element) in source. */}
          <a onClick={childOnClick}>Docs</a>
        </Link>,
      );
      fireEvent.click(screen.getByRole("link"));
      expect(childOnClick).not.toHaveBeenCalled();
    });

    it("has no accessibility violations when disabled", async () => {
      const { container } = render(
        <Link href="/docs" disabled>
          Docs
        </Link>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Link href="https://example.com">Accessible external link</Link>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with asChild", async () => {
    const { container } = render(
      <Link asChild href="/docs">
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- see the Slot
        test above; Link's own href is merged onto this anchor at render time. */}
        <a>Docs</a>
      </Link>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
