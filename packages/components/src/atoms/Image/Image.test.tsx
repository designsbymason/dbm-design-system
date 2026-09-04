import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Image } from "./Image";

describe("Image", () => {
  it("renders a native img with src/alt", () => {
    render(<Image src="/photo.jpg" alt="A photo" />);
    const img = screen.getByAltText("A photo");
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "/photo.jpg");
  });

  it("lazy-loads by default", () => {
    render(<Image src="/photo.jpg" alt="A photo" />);
    expect(screen.getByAltText("A photo")).toHaveAttribute("loading", "lazy");
  });

  it("allows overriding loading to eager", () => {
    render(<Image src="/photo.jpg" alt="A photo" loading="eager" />);
    expect(screen.getByAltText("A photo")).toHaveAttribute("loading", "eager");
  });

  it("renders a default image-icon fallback when src is missing and no custom fallback is given", () => {
    const { container } = render(<Image alt="A photo" />);
    expect(screen.queryByAltText("A photo")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "A photo" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the default fallback icon when the image fails to load and no custom fallback is given", () => {
    const { container } = render(<Image src="/broken.jpg" alt="A photo" />);
    fireEvent.error(screen.getByAltText("A photo"));
    expect(screen.queryByAltText("A photo")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("lets a custom fallback override the default image-icon fallback", () => {
    const { container } = render(
      <Image alt="A photo" fallback={<span>No photo</span>} />,
    );
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders the fallback instead of an img when src is missing", () => {
    render(<Image alt="A photo" fallback={<span>No photo</span>} />);
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(screen.queryByAltText("A photo")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "A photo" })).toBeInTheDocument();
  });

  it("swaps to the fallback when the image fails to load", () => {
    render(
      <Image src="/broken.jpg" alt="A photo" fallback={<span>No photo</span>} />,
    );
    const img = screen.getByAltText("A photo");
    fireEvent.error(img);
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(screen.queryByAltText("A photo")).not.toBeInTheDocument();
  });

  it("still swaps to the fallback when a consumer's own onError is also provided (regression)", () => {
    // A consumer-provided `onError` must compose with Image's own internal
    // fallback-triggering handler, not silently replace it — the same
    // pattern already established on Avatar's own `onError`
    // (05-component-api-conventions.md §3's class of bug, generalized from
    // aria-*/role attributes to an internally-required event handler).
    const onError = vi.fn();
    render(
      <Image
        src="/broken.jpg"
        alt="A photo"
        fallback={<span>No photo</span>}
        onError={onError}
      />,
    );
    fireEvent.error(screen.getByAltText("A photo"));
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("resets the failure state when src changes", () => {
    const { rerender } = render(
      <Image src="/broken.jpg" alt="A photo" fallback={<span>No photo</span>} />,
    );
    fireEvent.error(screen.getByAltText("A photo"));
    expect(screen.getByText("No photo")).toBeInTheDocument();

    rerender(
      <Image src="/good.jpg" alt="A photo" fallback={<span>No photo</span>} />,
    );
    expect(screen.getByAltText("A photo")).toBeInTheDocument();
    expect(screen.queryByText("No photo")).not.toBeInTheDocument();
  });

  it("applies aspectRatio as an inline style on the wrapper", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" aspectRatio={16 / 9} />,
    );
    expect(container.firstChild).toHaveStyle({
      aspectRatio: `${16 / 9}`,
    });
  });

  it("applies objectFit as an inline style on the img", () => {
    render(<Image src="/photo.jpg" alt="A photo" objectFit="contain" />);
    expect(screen.getByAltText("A photo")).toHaveStyle({
      objectFit: "contain",
    });
  });

  it("defaults position to center", () => {
    render(<Image src="/photo.jpg" alt="A photo" />);
    expect(screen.getByAltText("A photo")).toHaveStyle({
      objectPosition: "center",
    });
  });

  it("applies position as the CSS object-position on the img", () => {
    render(<Image src="/photo.jpg" alt="A photo" position="top" />);
    expect(screen.getByAltText("A photo")).toHaveStyle({
      objectPosition: "top",
    });
  });

  it("maps each corner position to its two-keyword object-position value", () => {
    const cases = [
      ["top-left", "left top"],
      ["top-right", "right top"],
      ["bottom-left", "left bottom"],
      ["bottom-right", "right bottom"],
    ] as const;
    for (const [position, expected] of cases) {
      const { unmount } = render(
        <Image src="/photo.jpg" alt="A photo" position={position} />,
      );
      expect(screen.getByAltText("A photo")).toHaveStyle({
        objectPosition: expected,
      });
      unmount();
    }
  });

  it("applies radius as a token-driven border-radius on the wrapper", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" radius="full" />,
    );
    expect(container.firstChild).toHaveStyle({
      borderRadius: "var(--dbm-radius-full)",
    });
  });

  it("supports the full radius scale, including 3xl", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" radius="3xl" />,
    );
    expect(container.firstChild).toHaveStyle({
      borderRadius: "var(--dbm-radius-3xl)",
    });
  });

  it("applies width and/or height as inline styles on the wrapper (not just attributes on the img)", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" width={320} height={180} />,
    );
    expect(container.firstChild).toHaveStyle({ width: "320px", height: "180px" });
  });

  it("applies a single dimension alone (no aspectRatio, no other dimension) to the wrapper", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" width={320} />,
    );
    expect(container.firstChild).toHaveStyle({ width: "320px" });
  });

  it("still forwards width/height as native attributes on the img itself", () => {
    render(<Image src="/photo.jpg" alt="A photo" width={320} height={180} />);
    const img = screen.getByAltText("A photo");
    expect(img).toHaveAttribute("width", "320");
    expect(img).toHaveAttribute("height", "180");
  });

  it("passes both width and aspectRatio through to the wrapper (CSS computes the missing height)", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" width={320} aspectRatio={16 / 9} />,
    );
    expect(container.firstChild).toHaveStyle({
      width: "320px",
      aspectRatio: `${16 / 9}`,
    });
  });

  it("passes both height and aspectRatio through to the wrapper (CSS computes the missing width)", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" height={180} aspectRatio={16 / 9} />,
    );
    expect(container.firstChild).toHaveStyle({
      height: "180px",
      aspectRatio: `${16 / 9}`,
    });
  });

  it("warns in development when width/height genuinely conflict with aspectRatio", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Image
        src="/photo.jpg"
        alt="A photo"
        width={320}
        height={180}
        aspectRatio={1}
      />,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`width`/`height`"),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("conflicts"));
    warnSpy.mockRestore();
  });

  it("does not warn when width/height's own ratio already matches aspectRatio (redundant, not conflicting)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Image
        src="/photo.jpg"
        alt="A photo"
        width={320}
        height={180}
        aspectRatio={16 / 9}
      />,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does not warn about a width/height + aspectRatio conflict when only one dimension is given", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Image src="/photo.jpg" alt="A photo" width={320} aspectRatio={1} />);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does not attempt to validate a string width/height against aspectRatio", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Image
        src="/photo.jpg"
        alt="A photo"
        width="100%"
        height="50%"
        aspectRatio={1}
      />,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns in development on an invalid aspectRatio, and does not warn for a valid one", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Image src="/photo.jpg" alt="A photo" aspectRatio={-1} />);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`aspectRatio` must be a positive, finite number"),
    );
    warnSpy.mockClear();
    render(<Image src="/photo.jpg" alt="A photo" aspectRatio={16 / 9} />);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("applies id and data-testid to the wrapper, surviving the fallback swap", () => {
    const { container, rerender } = render(
      <Image
        id="my-image"
        data-testid="wrapper"
        src="/broken.jpg"
        alt="A photo"
        fallback={<span>No photo</span>}
      />,
    );
    expect(screen.getByTestId("wrapper")).toHaveAttribute("id", "my-image");
    expect(container.firstChild).toBe(screen.getByTestId("wrapper"));

    fireEvent.error(screen.getByAltText("A photo"));
    expect(screen.getByTestId("wrapper")).toHaveAttribute("id", "my-image");

    rerender(
      <Image
        id="my-image"
        data-testid="wrapper"
        alt="A photo"
        fallback={<span>No photo</span>}
      />,
    );
    expect(screen.getByTestId("wrapper")).toHaveAttribute("id", "my-image");
  });

  it("hides a decorative (alt=\"\") fallback from the accessibility tree instead of exposing an empty-named role=img", () => {
    render(<Image alt="" fallback={<span>Decorative</span>} />);
    const fallback = screen.getByText("Decorative").parentElement;
    expect(fallback).toHaveAttribute("aria-hidden", "true");
    expect(fallback).not.toHaveAttribute("role");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps a meaningful (non-empty alt) fallback exposed as role=img", () => {
    render(<Image alt="A photo" fallback={<span>No photo</span>} />);
    expect(screen.getByRole("img", { name: "A photo" })).toBeInTheDocument();
  });

  it("forwards ref to the wrapper, stable across the image/fallback swap", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Image
        ref={ref}
        src="/broken.jpg"
        alt="A photo"
        fallback={<span>No photo</span>}
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    fireEvent.error(screen.getByAltText("A photo"));
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("applies className to the wrapper", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" className="custom" />,
    );
    expect(container.firstChild).toHaveClass("custom");
  });

  it("forwards native img props", () => {
    render(<Image src="/photo.jpg" alt="A photo" width={200} height={100} />);
    const img = screen.getByAltText("A photo");
    expect(img).toHaveAttribute("width", "200");
    expect(img).toHaveAttribute("height", "100");
  });

  it("has no accessibility violations, loaded or in fallback", async () => {
    const { container, rerender } = render(
      <Image src="/photo.jpg" alt="A photo" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Image alt="A photo" fallback={<span>No photo</span>} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with the default icon fallback (no custom fallback given)", async () => {
    const { container } = render(<Image alt="A photo" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when decorative (alt=\"\"), loaded or in fallback", async () => {
    const { container, rerender } = render(
      <Image src="/photo.jpg" alt="" />,
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(<Image alt="" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
