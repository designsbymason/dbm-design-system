import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
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

  it("applies radius as a token-driven border-radius on the wrapper", () => {
    const { container } = render(
      <Image src="/photo.jpg" alt="A photo" radius="full" />,
    );
    expect(container.firstChild).toHaveStyle({
      borderRadius: "var(--dbm-radius-full)",
    });
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
});
