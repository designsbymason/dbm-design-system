import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AspectRatio } from "./AspectRatio";

describe("AspectRatio", () => {
  it("renders its children", () => {
    render(
      <AspectRatio>
        <img src="/photo.jpg" alt="A test graphic" />
      </AspectRatio>,
    );
    expect(screen.getByAltText("A test graphic")).toBeInTheDocument();
  });

  it("defaults to a 16:9 ratio", () => {
    const { container } = render(
      <AspectRatio>
        <div />
      </AspectRatio>,
    );
    expect(container.firstChild).toHaveStyle({ aspectRatio: "1.7777777777777777" });
  });

  it("applies a custom ratio", () => {
    const { container } = render(
      <AspectRatio ratio={1}>
        <div />
      </AspectRatio>,
    );
    expect(container.firstChild).toHaveStyle({ aspectRatio: "1" });
  });

  it("forwards ref to the outer element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <AspectRatio ref={ref}>
        <div />
      </AspectRatio>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className to the outer element", () => {
    const { container } = render(
      <AspectRatio className="custom">
        <div />
      </AspectRatio>,
    );
    expect(container.firstChild).toHaveClass("custom");
  });

  it("merges a custom style onto the computed aspectRatio", () => {
    const { container } = render(
      <AspectRatio ratio={1} style={{ maxWidth: "20rem" }}>
        <div />
      </AspectRatio>,
    );
    expect(container.firstChild).toHaveStyle({ aspectRatio: "1", maxWidth: "20rem" });
  });

  it("lets a custom style.aspectRatio override the ratio prop", () => {
    const { container } = render(
      <AspectRatio ratio={1} style={{ aspectRatio: "2" }}>
        <div />
      </AspectRatio>,
    );
    expect(container.firstChild).toHaveStyle({ aspectRatio: "2" });
  });

  it("applies id and data-testid to the outer element", () => {
    render(
      <AspectRatio id="hero-media" data-testid="hero-media">
        <div />
      </AspectRatio>,
    );
    const element = screen.getByTestId("hero-media");
    expect(element).toHaveAttribute("id", "hero-media");
  });

  describe("invalid ratio", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("warns in development when ratio is not a positive, finite number", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <AspectRatio ratio={0}>
          <div />
        </AspectRatio>,
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("AspectRatio"));
    });

    it("does not warn for a valid ratio", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <AspectRatio ratio={4 / 3}>
          <div />
        </AspectRatio>,
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AspectRatio>
        <img src="/photo.jpg" alt="A test graphic" />
      </AspectRatio>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
