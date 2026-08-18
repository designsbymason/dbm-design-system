import { TagIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Tag } from "./Tag";

describe("Tag", () => {
  it("renders its label text", () => {
    render(<Tag>Design</Tag>);
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("renders a leading icon when leadingIcon is provided", () => {
    const { container } = render(<Tag leadingIcon={TagIcon}>Design</Tag>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a trailing icon when trailingIcon is provided", () => {
    const { container } = render(<Tag trailingIcon={TagIcon}>Design</Tag>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders both a leading and trailing icon together", () => {
    const { container } = render(
      <Tag leadingIcon={TagIcon} trailingIcon={TagIcon}>
        Design
      </Tag>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("does not render a remove button by default", () => {
    render(<Tag>Design</Tag>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a remove button when removable, with a default accessible label", () => {
    render(<Tag removable>Design</Tag>);
    expect(
      screen.getByRole("button", { name: "Remove Design" }),
    ).toBeInTheDocument();
  });

  it("supports a custom removeLabel", () => {
    render(
      <Tag removable removeLabel="Remove Design filter">
        Design
      </Tag>,
    );
    expect(
      screen.getByRole("button", { name: "Remove Design filter" }),
    ).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Tag removable onRemove={onRemove}>
        Design
      </Tag>,
    );
    await user.click(screen.getByRole("button", { name: "Remove Design" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not warn when removable and onRemove are used together, or neither is set", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Tag removable onRemove={() => {}}>
        Design
      </Tag>,
    );
    render(<Tag>Design</Tag>);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("warns once in development when removable is set without onRemove", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Tag removable>Design</Tag>);
    rerender(<Tag removable>Design (renamed)</Tag>);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`removable` is set without `onRemove`"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("forwards ref to the root span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Tag ref={ref}>Design</Tag>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("applies className", () => {
    render(<Tag className="custom">Design</Tag>);
    expect(screen.getByText("Design").closest("span")).toHaveClass("custom");
  });

  it("defaults to the neutral tone and subtle variant", () => {
    render(<Tag data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleNeutral/);
  });

  it("applies the matching class for each tone", () => {
    const { rerender } = render(<Tag tone="neutral" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleNeutral/);

    rerender(<Tag tone="info" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleInfo/);

    rerender(<Tag tone="success" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleSuccess/);

    rerender(<Tag tone="warning" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleWarning/);

    rerender(<Tag tone="danger" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/subtleDanger/);
  });

  it("applies the matching class for the solid variant, per tone", () => {
    const { rerender } = render(
      <Tag tone="neutral" variant="solid" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/solidNeutral/);

    rerender(
      <Tag tone="danger" variant="solid" data-testid="tag">
        Design
      </Tag>,
    );
    expect(screen.getByTestId("tag").className).toMatch(/solidDanger/);
  });

  it("defaults to size md", () => {
    render(<Tag data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeMd/);
  });

  it("applies the matching class for each size", () => {
    const { rerender } = render(<Tag size="xs" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeXs/);

    rerender(<Tag size="sm" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeSm/);

    rerender(<Tag size="lg" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeLg/);

    rerender(<Tag size="xl" data-testid="tag">Design</Tag>);
    expect(screen.getByTestId("tag").className).toMatch(/sizeXl/);
  });

  it("has no accessibility violations, plain, with an icon, or removable", async () => {
    const { container, rerender } = render(<Tag>Design</Tag>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Tag leadingIcon={TagIcon}>Design</Tag>);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Tag removable onRemove={() => {}}>
        Design
      </Tag>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("clickable/selectable mode", () => {
    it("is not focusable or interactive by default", () => {
      render(<Tag>Design</Tag>);
      const tag = screen.getByText("Design");
      expect(tag).not.toHaveAttribute("role");
      expect(tag).not.toHaveAttribute("tabindex");
      expect(tag).not.toHaveAttribute("aria-pressed");
    });

    it("becomes focusable and clickable when onClick is provided", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Tag onClick={onClick}>Design</Tag>);
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("tabindex", "0");
      expect(tag).not.toHaveAttribute("aria-pressed");

      await user.click(tag);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("supports controlled selected state via aria-pressed, without toggling on its own", async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      render(
        <Tag selected onSelectedChange={onSelectedChange}>
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("aria-pressed", "true");

      await user.click(tag);
      expect(onSelectedChange).toHaveBeenCalledWith(false);
      // Controlled: the DOM doesn't change until the parent re-renders
      // with a new `selected` value.
      expect(tag).toHaveAttribute("aria-pressed", "true");
    });

    it("supports uncontrolled defaultSelected state, toggling internally on click", async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      render(
        <Tag defaultSelected={false} onSelectedChange={onSelectedChange}>
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("aria-pressed", "false");

      await user.click(tag);
      expect(tag).toHaveAttribute("aria-pressed", "true");
      expect(onSelectedChange).toHaveBeenCalledWith(true);
    });

    it("toggles selected via Enter and Space on the keyboard", async () => {
      const user = userEvent.setup();
      render(<Tag defaultSelected={false}>Design</Tag>);
      const tag = screen.getByRole("button", { name: "Design" });

      await user.tab();
      expect(tag).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(tag).toHaveAttribute("aria-pressed", "true");
      await user.keyboard(" ");
      expect(tag).toHaveAttribute("aria-pressed", "false");
    });

    it("applies the selected visual class only once selected", () => {
      // Controlled `selected`, not `defaultSelected` — a `defaultSelected`
      // change on `rerender` wouldn't be expected to do anything (real
      // uncontrolled semantics, matching `defaultChecked`/`defaultValue`
      // elsewhere: the initial value is only read once, at mount).
      const { rerender } = render(
        <Tag selected={false} data-testid="tag">
          Design
        </Tag>,
      );
      expect(screen.getByTestId("tag").className).not.toMatch(/selected/);

      rerender(
        <Tag selected data-testid="tag">
          Design
        </Tag>,
      );
      expect(screen.getByTestId("tag").className).toMatch(/selected/);
    });

    it("renders a real, independently focusable remove button when removable but not interactive", () => {
      render(
        <Tag removable onRemove={() => {}}>
          Design
        </Tag>,
      );
      const removeButton = screen.getByRole("button", { name: "Remove Design" });
      expect(removeButton.tagName).toBe("BUTTON");
    });

    it("renders remove as a decorative, non-focusable glyph when combined with onClick/selected, and handles it without triggering the tag's own click", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const onSelectedChange = vi.fn();
      const { container } = render(
        <Tag
          removable
          onRemove={onRemove}
          defaultSelected={false}
          onSelectedChange={onSelectedChange}
        >
          Design
        </Tag>,
      );
      // No second focusable "Remove Design" control once the tag itself
      // is interactive — see Tag.tsx's own comment on this branch for why
      // (a real nested button would be an axe "nested-interactive"
      // violation).
      expect(
        screen.queryByRole("button", { name: "Remove Design" }),
      ).not.toBeInTheDocument();

      const removeIcon = container.querySelector('[class*="removeDecorative"]');
      expect(removeIcon).not.toBeNull();
      await user.click(removeIcon as Element);
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onSelectedChange).not.toHaveBeenCalled();
    });

    it("removes via Delete/Backspace on the tag itself when combined with onClick/selected", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const onSelectedChange = vi.fn();
      render(
        <Tag
          removable
          onRemove={onRemove}
          defaultSelected={false}
          onSelectedChange={onSelectedChange}
        >
          Design
        </Tag>,
      );
      const tag = screen.getByRole("button", { name: "Design" });
      expect(tag).toHaveAttribute("aria-keyshortcuts", "Delete Backspace");

      await user.tab();
      expect(tag).toHaveFocus();
      await user.keyboard("{Delete}");
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onSelectedChange).not.toHaveBeenCalled();
    });

    it("has no accessibility violations when clickable, selectable, or both combined with removable", async () => {
      const { container, rerender } = render(<Tag onClick={() => {}}>Design</Tag>);
      expect((await axe(container)).violations).toHaveLength(0);

      rerender(
        <Tag defaultSelected onSelectedChange={() => {}}>
          Design
        </Tag>,
      );
      expect((await axe(container)).violations).toHaveLength(0);

      rerender(
        <Tag
          removable
          onRemove={() => {}}
          defaultSelected
          onSelectedChange={() => {}}
        >
          Design
        </Tag>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
