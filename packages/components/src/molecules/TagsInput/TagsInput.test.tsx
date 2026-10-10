import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "../FormField";
import { TagsInput } from "./TagsInput";

const entry = () => screen.getByRole("textbox") as HTMLInputElement;
const chips = () => screen.queryAllByRole("listitem").map((item) => item.textContent?.trim());

describe("TagsInput", () => {
  describe("structure and naming", () => {
    it("is a labelled group of a list of chips and one entry", () => {
      render(<TagsInput aria-label="Labels" defaultValue={["one", "two"]} />);
      expect(screen.getByRole("group", { name: "Labels" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Labels" })).toBeInTheDocument();
      expect(chips()).toEqual(["one", "two"]);
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
    });

    it("draws its chips in the brand tone by default, and in the tone it is given", () => {
      const { rerender } = render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      expect(screen.getByText("one").closest("li")?.querySelector("span")?.className).toMatch(/subtleBrand/);
      rerender(<TagsInput aria-label="Labels" tone="neutral" variant="solid" defaultValue={["one"]} />);
      expect(screen.getByText("one").closest("li")?.querySelector("span")?.className).toMatch(/solidNeutral/);
    });

    it("puts each tag's text in its own label, so a narrow box can cut it, and shows no tooltip for one that fits", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["a-rather-long-tag"]} />);
      expect(screen.getByText("a-rather-long-tag").tagName).toBe("SPAN");
      expect(screen.getByRole("button", { name: "Remove a-rather-long-tag" })).toBeInTheDocument();
      // jsdom lays nothing out, so nothing is cut and no tooltip opens: the real-browser checks show the cut case.
      await user.hover(screen.getByText("a-rather-long-tag"));
      expect(screen.queryByRole("tooltip")).toBeNull();
    });

    it("gives each chip a named remove button", () => {
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      expect(screen.getByRole("button", { name: "Remove one" })).toBeInTheDocument();
    });

    it("shows the placeholder only while there are no tags", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" placeholder="Add a label" />);
      expect(entry()).toHaveAttribute("placeholder", "Add a label");
      await user.type(entry(), "one{Enter}");
      expect(entry()).not.toHaveAttribute("placeholder");
    });

    it("reads a value that is not an array of strings as empty without throwing", () => {
      render(<TagsInput aria-label="Labels" value={undefined as unknown as string[]} defaultValue={["x"]} />);
      expect(chips()).toEqual(["x"]);
      render(<TagsInput aria-label="Other" value={"nope" as unknown as string[]} />);
      expect(screen.getAllByRole("textbox")).toHaveLength(2);
    });

    it("warns once in development when it has no accessible name", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<TagsInput />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
      warn.mockRestore();
    });
  });

  describe("adding", () => {
    it("adds on Enter, reports the new array and empties the entry", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TagsInput aria-label="Labels" onValueChange={onValueChange} />);
      await user.type(entry(), "design{Enter}");
      expect(onValueChange).toHaveBeenLastCalledWith(["design"]);
      expect(chips()).toEqual(["design"]);
      expect(entry()).toHaveValue("");
    });

    it("does nothing on Enter with an empty entry, so a form can submit", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <TagsInput aria-label="Labels" />
          <button type="submit">Go</button>
        </form>,
      );
      await user.click(entry());
      await user.keyboard("{Enter}");
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("does not submit a surrounding form while text is pending", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <TagsInput aria-label="Labels" />
        </form>,
      );
      await user.type(entry(), "one{Enter}");
      expect(onSubmit).not.toHaveBeenCalled();
      expect(chips()).toEqual(["one"]);
    });

    it("adds when a separator is typed, keeping what follows it", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" />);
      await user.type(entry(), "one,tw");
      expect(chips()).toEqual(["one"]);
      expect(entry()).toHaveValue("tw");
    });

    it("uses the separators it is given, and splits a paste at line breaks too", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" separators={[";"]} />);
      await user.type(entry(), "a;");
      expect(chips()).toEqual(["a"]);
      await user.click(entry());
      await user.paste("b\nc;d");
      expect(chips()).toEqual(["a", "b", "c", "d"]);
    });

    it("splits a pasted list into tags and announces the summary", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["x"]} />);
      await user.click(entry());
      await user.paste("x,y,z");
      expect(chips()).toEqual(["x", "y", "z"]);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 added, 1 not added"));
    });

    it("trims by default and drops an empty piece", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" />);
      await user.type(entry(), "  one  ,, two {Enter}");
      expect(chips()).toEqual(["one", "two"]);
    });

    it("applies transform before the checks", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" transform={(raw) => raw.trim().replace(/^#/, "").toLowerCase()} />);
      await user.type(entry(), "#Design{Enter}");
      expect(chips()).toEqual(["design"]);
    });

    it("trims when transform throws, with a development warning", async () => {
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <TagsInput
          aria-label="Labels"
          transform={() => {
            throw new Error("nope");
          }}
        />,
      );
      await user.type(entry(), " one {Enter}");
      expect(chips()).toEqual(["one"]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`transform` threw"));
      warn.mockRestore();
    });

    it("adds typed text when focus leaves, unless addOnBlur is off", async () => {
      const user = userEvent.setup();
      const { unmount } = render(
        <>
          <TagsInput aria-label="Labels" />
          <button type="button">Other</button>
        </>,
      );
      await user.type(entry(), "pending");
      await user.tab();
      await waitFor(() => expect(chips()).toEqual(["pending"]));
      unmount();
      render(
        <>
          <TagsInput aria-label="Labels" addOnBlur={false} />
          <button type="button">Other</button>
        </>,
      );
      await user.type(entry(), "pending");
      await user.click(screen.getByRole("button", { name: "Other" }));
      expect(chips()).toEqual([]);
      expect(entry()).toHaveValue("pending");
    });

    it("does not read moving to a chip's button as leaving", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.type(entry(), "draft");
      await user.keyboard("{Home}{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Remove one" })).toHaveFocus();
      expect(chips()).toEqual(["one"]);
      expect(entry()).toHaveValue("draft");
    });

    it("ignores an Enter that belongs to an input-method composition", () => {
      render(<TagsInput aria-label="Labels" />);
      fireEvent.change(entry(), { target: { value: "かな" } });
      fireEvent.keyDown(entry(), { key: "Enter", isComposing: true, keyCode: 229 });
      expect(chips()).toEqual([]);
      expect(entry()).toHaveValue("かな");
    });
  });

  describe("refusing", () => {
    it("refuses a repeat with a message and keeps the text", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["design"]} />);
      await user.type(entry(), "design{Enter}");
      expect(screen.getByRole("alert")).toHaveTextContent("design is already added");
      expect(entry()).toHaveValue("design");
      expect(entry()).toHaveAttribute("aria-invalid", "true");
      expect(entry()).toHaveAccessibleDescription(/design is already added/);
      expect(chips()).toEqual(["design"]);
    });

    it("allows repeats with allowDuplicates", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" allowDuplicates defaultValue={["egg"]} />);
      await user.type(entry(), "egg{Enter}");
      expect(chips()).toEqual(["egg", "egg"]);
    });

    it("stops at maxTags with a message", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" maxTags={2} defaultValue={["a", "b"]} />);
      await user.type(entry(), "c{Enter}");
      expect(screen.getByRole("alert")).toHaveTextContent("No more than 2 tags");
      expect(chips()).toEqual(["a", "b"]);
    });

    it("cuts a paste short at maxTags and says how many were not added", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" maxTags={3} defaultValue={["a"]} />);
      await user.click(entry());
      await user.paste("b,c,d,e");
      expect(chips()).toEqual(["a", "b", "c"]);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 added, 1 not added"));
    });

    it("refuses a tag validate rejects, with its message, and accepts one it doesn't", async () => {
      const user = userEvent.setup();
      render(
        <TagsInput aria-label="Emails" validate={(tag) => (tag.includes("@") ? undefined : "Not an email address")} />,
      );
      await user.type(entry(), "nope{Enter}");
      expect(screen.getByRole("alert")).toHaveTextContent("Not an email address");
      await user.clear(entry());
      await user.type(entry(), "a@b.co{Enter}");
      expect(chips()).toEqual(["a@b.co"]);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("accepts the tag, with a development warning, when validate throws", async () => {
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <TagsInput
          aria-label="Labels"
          validate={() => {
            throw new Error("boom");
          }}
        />,
      );
      await user.type(entry(), "one{Enter}");
      expect(chips()).toEqual(["one"]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`validate` threw"));
      warn.mockRestore();
    });

    it("keeps a refused typed-separator piece in the entry so it can be fixed", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.type(entry(), "one,");
      expect(entry()).toHaveValue("one");
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("clears the message when the text changes", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.type(entry(), "one{Enter}");
      expect(screen.getByRole("alert")).toBeInTheDocument();
      await user.keyboard("x");
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("limits the length of a tag with maxTagLength", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" maxTagLength={3} />);
      await user.type(entry(), "abcdef");
      expect(entry()).toHaveValue("abc");
    });
  });

  describe("removing", () => {
    it("removes the last tag with Backspace on an empty entry and announces it", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TagsInput aria-label="Labels" defaultValue={["one", "two"]} onValueChange={onValueChange} />);
      await user.click(entry());
      await user.keyboard("{Backspace}");
      expect(onValueChange).toHaveBeenLastCalledWith(["one"]);
      expect(chips()).toEqual(["one"]);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("two removed"));
    });

    it("deletes text, not a tag, with Backspace while there is text", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.type(entry(), "ab{Backspace}");
      expect(entry()).toHaveValue("a");
      expect(chips()).toEqual(["one"]);
    });

    it("removes a chip with its button and puts focus in the entry", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one", "two", "three"]} />);
      await user.click(screen.getByRole("button", { name: "Remove two" }));
      expect(chips()).toEqual(["one", "three"]);
      expect(entry()).toHaveFocus();
    });

    it("clears the pending text with Escape, and not a tag", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.type(entry(), "draft{Escape}");
      expect(entry()).toHaveValue("");
      expect(chips()).toEqual(["one"]);
    });

    it("lets Escape through when there is nothing to clear, and stops it when there is", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a stand-in for a surrounding surface
        <div onKeyDown={onKeyDown}>
          <TagsInput aria-label="Labels" />
        </div>,
      );
      await user.click(entry());
      onKeyDown.mockClear();
      await user.keyboard("{Escape}");
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      await user.keyboard("a");
      onKeyDown.mockClear();
      await user.keyboard("{Escape}");
      expect(onKeyDown).not.toHaveBeenCalled();
    });

    it("clears every tag with the clear-all button, and keeps the place of a keyboard user", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TagsInput aria-label="Labels" clearable defaultValue={["one", "two"]} onValueChange={onValueChange} />);
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "Clear all" })).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(onValueChange).toHaveBeenLastCalledWith([]);
      expect(entry()).toHaveFocus();
      expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
    });
  });

  describe("controlled", () => {
    it("shows the value prop until it changes, reporting through onValueChange", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TagsInput aria-label="Labels" value={["one"]} onValueChange={onValueChange} />);
      await user.type(entry(), "two{Enter}");
      expect(onValueChange).toHaveBeenCalledWith(["one", "two"]);
      expect(chips()).toEqual(["one"]);
    });

    it("works wired to its own state, for tags and the pending text together", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [tags, setTags] = useState(["one"]);
        const [text, setText] = useState("");
        return (
          <>
            <TagsInput
              aria-label="Labels"
              value={tags}
              onValueChange={setTags}
              inputValue={text}
              onInputValueChange={setText}
            />
            <output data-testid="text">{text}</output>
          </>
        );
      }
      render(<Wired />);
      await user.type(entry(), "tw");
      expect(screen.getByTestId("text")).toHaveTextContent("tw");
      await user.keyboard("o{Enter}");
      expect(chips()).toEqual(["one", "two"]);
      expect(screen.getByTestId("text")).toHaveTextContent("");
    });

    it("never mutates the array it was given", async () => {
      const user = userEvent.setup();
      const given = ["one"];
      render(<TagsInput aria-label="Labels" defaultValue={given} />);
      await user.type(entry(), "two{Enter}");
      expect(given).toEqual(["one"]);
    });
  });

  describe("chip keyboard model", () => {
    it("is one tab stop for the chips and the entry, with the chips' buttons out of the tab order", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <TagsInput aria-label="Labels" defaultValue={["one", "two"]} />
          <button type="button">After</button>
        </>,
      );
      expect(screen.getByRole("button", { name: "Remove one" })).toHaveAttribute("tabindex", "-1");
      await user.tab();
      await user.tab();
      expect(entry()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(entry()).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
    });

    it("moves from the start of the entry to the last chip with the left arrow, and not from mid-text", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one", "two"]} />);
      await user.type(entry(), "ab");
      await user.keyboard("{ArrowLeft}");
      expect(entry()).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(entry()).toHaveFocus();
      expect((entry() as HTMLInputElement).selectionStart).toBe(0);
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Remove two" })).toHaveFocus();
    });

    it("moves along the chips with the arrow keys, Home and End, and back to the entry past the last", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one", "two", "three"]} />);
      await user.click(entry());
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Remove three" })).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Remove two" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(screen.getByRole("button", { name: "Remove one" })).toHaveFocus();
      await user.keyboard("{End}");
      expect(screen.getByRole("button", { name: "Remove three" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(entry()).toHaveFocus();
    });

    it("removes the focused chip with Delete and leaves focus on the one that took its place", async () => {
      const user = userEvent.setup();
      const onTagRemove = vi.fn();
      render(<TagsInput aria-label="Labels" defaultValue={["one", "two", "three"]} onTagRemove={onTagRemove} />);
      await user.click(entry());
      await user.keyboard("{ArrowLeft}{ArrowLeft}{Delete}");
      expect(chips()).toEqual(["one", "three"]);
      expect(screen.getByRole("button", { name: "Remove three" })).toHaveFocus();
      expect(onTagRemove).toHaveBeenCalledWith("two", { index: 1, source: "keyboard" });
      await user.keyboard("{Delete}");
      expect(chips()).toEqual(["one"]);
      expect(screen.getByRole("button", { name: "Remove one" })).toHaveFocus();
      await user.keyboard("{Backspace}");
      expect(chips()).toEqual([]);
      expect(entry()).toHaveFocus();
    });

    it("keeps the place along the row when a chip is removed with Enter, and returns to the entry for a press", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one", "two", "three"]} />);
      await user.click(entry());
      await user.keyboard("{ArrowLeft}{ArrowLeft}{Enter}");
      expect(chips()).toEqual(["one", "three"]);
      expect(screen.getByRole("button", { name: "Remove three" })).toHaveFocus();
      await user.click(screen.getByRole("button", { name: "Remove one" }));
      expect(entry()).toHaveFocus();
    });

    it("returns to the entry with Escape from a chip", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.click(entry());
      await user.keyboard("{ArrowLeft}{Escape}");
      expect(entry()).toHaveFocus();
    });

    it("describes the entry with how to reach the chips, only once there are some", () => {
      const { rerender } = render(<TagsInput aria-label="Labels" />);
      expect(entry()).not.toHaveAccessibleDescription();
      rerender(<TagsInput aria-label="Labels" value={["one"]} />);
      expect(entry()).toHaveAccessibleDescription("Use the left arrow key to move to the tags");
    });
  });

  describe("flagging invalid tags", () => {
    const email = (tag: string) => (tag.includes("@") ? undefined : "Not an email address");

    it("adds a tag validate rejects, drawn in the danger tone with its reason read after it", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <TagsInput aria-label="Emails" invalidBehavior="flag" validate={email} onValueChange={onValueChange} />,
      );
      await user.type(entry(), "nope{Enter}");
      expect(onValueChange).toHaveBeenLastCalledWith(["nope"]);
      expect(entry()).toHaveValue("");
      const chip = screen.getByRole("listitem");
      expect(chip.querySelector("span")?.className).toMatch(/subtleDanger/);
      expect(chip).toHaveTextContent("nope, Not an email address");
      expect(entry()).toHaveAttribute("aria-invalid", "true");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("nope added, not valid: Not an email address"));
    });

    it("flags a tag that arrives through value, and clears the flag once it is corrected", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [tags, setTags] = useState(["bad", "a@b.co"]);
        return <TagsInput aria-label="Emails" invalidBehavior="flag" validate={email} value={tags} onValueChange={setTags} />;
      }
      render(<Wired />);
      const items = screen.getAllByRole("listitem");
      expect(items[0]?.querySelector("span")?.className).toMatch(/subtleDanger/);
      expect(items[1]?.querySelector("span")?.className).toMatch(/subtleBrand/);
      await user.click(screen.getByRole("button", { name: "Remove bad" }));
      expect(entry()).not.toHaveAttribute("aria-invalid");
    });

    it("still refuses a repeat and a tag past maxTags", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Emails" invalidBehavior="flag" validate={email} maxTags={2} defaultValue={["a@b.co"]} />);
      await user.type(entry(), "a@b.co{Enter}");
      expect(screen.getByRole("alert")).toHaveTextContent("already added");
      await user.clear(entry());
      await user.type(entry(), "x{Enter}y{Enter}");
      expect(screen.getByRole("alert")).toHaveTextContent("No more than 2 tags");
    });

    it("stops a form submitting while a flagged tag is in the field, and lets it through once removed", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <TagsInput aria-label="Emails" name="emails" invalidBehavior="flag" validate={email} defaultValue={["bad"]} />
        </form>,
      );
      const form = container.querySelector("form") as HTMLFormElement;
      expect(form.checkValidity()).toBe(false);
      await user.click(screen.getByRole("button", { name: "Remove bad" }));
      expect(form.checkValidity()).toBe(true);
    });
  });

  describe("add and remove events", () => {
    it("reports each tag added with where it came from", async () => {
      const user = userEvent.setup();
      const onTagAdd = vi.fn();
      render(
        <>
          <TagsInput aria-label="Labels" onTagAdd={onTagAdd} />
          <button type="button">Other</button>
        </>,
      );
      await user.type(entry(), "a{Enter}b,c");
      await user.tab();
      await waitFor(() => expect(onTagAdd).toHaveBeenCalledTimes(3));
      expect(onTagAdd).toHaveBeenNthCalledWith(1, "a", { source: "enter" });
      expect(onTagAdd).toHaveBeenNthCalledWith(2, "b", { source: "separator" });
      expect(onTagAdd).toHaveBeenNthCalledWith(3, "c", { source: "blur" });
    });

    it("reports every accepted piece of a paste, and none of the refused", async () => {
      const user = userEvent.setup();
      const onTagAdd = vi.fn();
      render(<TagsInput aria-label="Labels" defaultValue={["x"]} onTagAdd={onTagAdd} />);
      await user.click(entry());
      await user.paste("x,y,z");
      expect(onTagAdd.mock.calls.map((call) => [call[0], call[1].source])).toEqual([
        ["y", "paste"],
        ["z", "paste"],
      ]);
    });

    it("reports a removal with its position and what removed it, and every tag on clear all", async () => {
      const user = userEvent.setup();
      const onTagRemove = vi.fn();
      render(<TagsInput aria-label="Labels" clearable defaultValue={["a", "b", "c"]} onTagRemove={onTagRemove} />);
      await user.click(screen.getByRole("button", { name: "Remove b" }));
      expect(onTagRemove).toHaveBeenLastCalledWith("b", { index: 1, source: "button" });
      await user.click(entry());
      await user.keyboard("{Backspace}");
      expect(onTagRemove).toHaveBeenLastCalledWith("c", { index: 1, source: "backspace" });
      onTagRemove.mockClear();
      await user.click(screen.getByRole("button", { name: "Clear all" }));
      expect(onTagRemove.mock.calls.map((call) => [call[0], call[1].index, call[1].source])).toEqual([
        ["a", 0, "clear"],
      ]);
    });
  });

  describe("counter and collapse", () => {
    it("shows count/max with maxTags, written through formatNumber, and only then", async () => {
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { rerender } = render(<TagsInput aria-label="Labels" showCount defaultValue={["a"]} />);
      expect(screen.queryByText(/\d+\/\d+/)).toBeNull();
      // The first time this message is produced in this file, so the once-only warning is seen here.
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`showCount` has nothing to show without `maxTags`"));
      warn.mockRestore();
      rerender(<TagsInput aria-label="Labels" showCount maxTags={5} defaultValue={["a"]} formatNumber={(n) => `#${n}`} />);
      expect(screen.getByText("#1/#5")).toBeInTheDocument();
      await user.type(entry(), "b{Enter}");
      expect(screen.getByText("#2/#5")).toBeInTheDocument();
    });

    it("collapses to maxVisible chips and a +N more button while the field is not in use", () => {
      render(<TagsInput aria-label="Labels" maxVisible={2} defaultValue={["a", "b", "c", "d"]} />);
      expect(chips()).toEqual(["a", "b"]);
      expect(screen.getByRole("button", { name: "+2 more" })).toHaveAttribute("aria-expanded", "false");
    });

    it("draws the +N more and Show less buttons in the tone and variant of the chips", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" tone="success" variant="solid" maxVisible={1} defaultValue={["a", "b", "c"]} />);
      expect(screen.getByRole("button", { name: "+2 more" }).className).toMatch(/solidSuccess/);
      await user.click(screen.getByRole("button", { name: "+2 more" }));
      expect(screen.getByRole("button", { name: "Show less" }).className).toMatch(/solidSuccess/);
    });

    it("shows every tag while the entry has focus, and collapses again when it leaves", async () => {
      const user = userEvent.setup();
      render(
        <>
          <TagsInput aria-label="Labels" maxVisible={1} defaultValue={["a", "b", "c"]} />
          <button type="button">Other</button>
        </>,
      );
      await user.click(entry());
      expect(chips()).toEqual(["a", "b", "c"]);
      await user.click(screen.getByRole("button", { name: "Other" }));
      await waitFor(() => expect(chips()).toEqual(["a"]));
    });

    it("opens with +N more, offers Show less, and keeps submitting the hidden tags", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <TagsInput aria-label="Labels" name="labels" maxVisible={1} defaultValue={["a", "b", "c"]} />
        </form>,
      );
      expect(new FormData(container.querySelector("form") as HTMLFormElement).getAll("labels")).toEqual(["a", "b", "c"]);
      await user.click(screen.getByRole("button", { name: "+2 more" }));
      expect(chips()).toEqual(["a", "b", "c"]);
      await user.click(screen.getByRole("button", { name: "Show less" }));
      expect(chips()).toEqual(["a"]);
    });

    it("does not collapse when there are no more tags than maxVisible", () => {
      render(<TagsInput aria-label="Labels" maxVisible={3} defaultValue={["a", "b", "c"]} />);
      expect(chips()).toEqual(["a", "b", "c"]);
      expect(screen.queryByRole("button", { name: /more/ })).toBeNull();
    });
  });

  describe("overflow collapse", () => {
    // jsdom lays nothing out, so the measured widths are given: every copy of a chip is 60 wide in a 200 wide row.
    function withWidths<T>(run: () => T): T {
      const rect = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
        const inMeasurer = Boolean(this.parentElement?.className.includes("measurer"));
        const width = inMeasurer ? 60 : 0;
        return { width, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      });
      const client = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
        return this.getAttribute("role") === "group" ? 200 : 0;
      });
      try {
        return run();
      } finally {
        rect.mockRestore();
        client.mockRestore();
      }
    }

    it("shows as many chips as fit and a +N more button for the rest", () => {
      withWidths(() => {
        render(<TagsInput aria-label="Labels" overflow="collapse" defaultValue={["a", "b", "c", "d"]} />);
        expect(chips()).toEqual(["a", "b"]);
        expect(screen.getByRole("button", { name: "+2 more" })).toBeInTheDocument();
      });
    });

    it("shows every chip, and no button, when they all fit", () => {
      withWidths(() => {
        render(<TagsInput aria-label="Labels" overflow="collapse" defaultValue={["a", "b"]} />);
        expect(chips()).toEqual(["a", "b"]);
        expect(screen.queryByRole("button", { name: /more/ })).toBeNull();
      });
    });

    it("never shows more than maxVisible, even when more would fit", () => {
      withWidths(() => {
        render(<TagsInput aria-label="Labels" overflow="collapse" maxVisible={1} defaultValue={["a", "b", "c"]} />);
        expect(chips()).toEqual(["a"]);
        expect(screen.getByRole("button", { name: "+2 more" })).toBeInTheDocument();
      });
    });

    it("shows every tag while the entry has focus, and the same hidden tags are still submitted", async () => {
      const user = userEvent.setup();
      await withWidths(async () => {
        const { container } = render(
          <form>
            <TagsInput aria-label="Labels" name="labels" overflow="collapse" defaultValue={["a", "b", "c", "d"]} />
          </form>,
        );
        expect(new FormData(container.querySelector("form") as HTMLFormElement).getAll("labels")).toEqual([
          "a",
          "b",
          "c",
          "d",
        ]);
        await user.click(entry());
        expect(chips()).toEqual(["a", "b", "c", "d"]);
      });
    });

    it("keeps an unseen copy of the chips out of the accessibility tree and the tab order", () => {
      withWidths(() => {
        const { container } = render(
          <TagsInput aria-label="Labels" overflow="collapse" defaultValue={["a", "b", "c", "d"]} />,
        );
        const frame = container.querySelector("[aria-hidden='true'][class*='measurerFrame']") as HTMLElement;
        expect(frame).not.toBeNull();
        expect(screen.queryAllByRole("listitem")).toHaveLength(2);
      });
    });

    it("does not measure or collapse anything with the default overflow", () => {
      withWidths(() => {
        const { container } = render(<TagsInput aria-label="Labels" defaultValue={["a", "b", "c", "d"]} />);
        expect(container.querySelector("[class*='measurerFrame']")).toBeNull();
        expect(chips()).toEqual(["a", "b", "c", "d"]);
      });
    });
  });

  describe("review fixes", () => {
    it("ignores an empty string in separators, with a development warning, instead of splitting every character", async () => {
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<TagsInput aria-label="Labels" separators={["", ";"]} />);
      await user.type(entry(), "abc");
      expect(chips()).toEqual([]);
      expect(entry()).toHaveValue("abc");
      await user.type(entry(), ";");
      expect(chips()).toEqual(["abc"]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("an empty string was passed in `separators`"));
      warn.mockRestore();
    });

    it("refuses a pasted or separator-ended piece longer than maxTagLength, with a message", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" maxTagLength={5} />);
      await user.click(entry());
      await user.paste("ok,toolong,fine");
      expect(chips()).toEqual(["ok", "fine"]);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 added, 1 not added"));
      expect(screen.getByRole("alert")).toHaveTextContent("toolong is longer than 5 characters");
    });

    it("moves to the chips with the plain left arrow only, not with a modifier held", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.click(entry());
      await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
      expect(entry()).toHaveFocus();
      await user.keyboard("{Control>}{ArrowLeft}{/Control}");
      expect(entry()).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Remove one" })).toHaveFocus();
    });

    it("keeps Escape on a chip from reaching a surrounding handler, and returns to the entry", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a stand-in for a surrounding surface
        <div onKeyDown={onKeyDown}>
          <TagsInput aria-label="Labels" defaultValue={["one"]} />
        </div>,
      );
      await user.click(entry());
      await user.keyboard("{ArrowLeft}");
      onKeyDown.mockClear();
      await user.keyboard("{Escape}");
      expect(entry()).toHaveFocus();
      expect(onKeyDown).not.toHaveBeenCalled();
    });

    it("pastes at the caret, not at the end", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" />);
      await user.type(entry(), "ab");
      await user.keyboard("{ArrowLeft}");
      await user.paste("x,y");
      expect(chips()).toEqual(["ax", "yb"]);
      expect(entry()).toHaveValue("");
    });

    it("warns about value with defaultValue and inputValue with defaultInputValue", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <TagsInput
          aria-label="Labels"
          value={["a"]}
          defaultValue={["b"]}
          inputValue=""
          defaultInputValue="draft"
          onValueChange={() => undefined}
          onInputValueChange={() => undefined}
        />,
      );
      const messages = warn.mock.calls.map((call) => String(call[0]));
      expect(messages.some((message) => message.includes("both `value` and `defaultValue`"))).toBe(true);
      expect(messages.some((message) => message.includes("both `inputValue` and `defaultInputValue`"))).toBe(true);
      warn.mockRestore();
    });

    it("survives StrictMode and a server render in collapse mode", async () => {
      expect(() => renderToString(<TagsInput aria-label="Labels" overflow="collapse" defaultValue={["a", "b"]} />)).not.toThrow();
      const rect = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
        const width = this.parentElement?.className.includes("measurer") ? 60 : 0;
        return { width, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      });
      const client = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
        return this.getAttribute("role") === "group" ? 200 : 0;
      });
      try {
        render(
          <StrictMode>
            <TagsInput aria-label="Labels" overflow="collapse" defaultValue={["a", "b", "c", "d"]} />
          </StrictMode>,
        );
        expect(chips()).toEqual(["a", "b"]);
        expect(screen.getByRole("button", { name: "+2 more" })).toBeInTheDocument();
      } finally {
        rect.mockRestore();
        client.mockRestore();
      }
    });
  });

  describe("states", () => {
    it("shows chips without remove buttons or a typing caret when read-only", () => {
      render(<TagsInput aria-label="Labels" readOnly defaultValue={["one"]} />);
      expect(screen.queryByRole("button", { name: "Remove one" })).toBeNull();
      expect(entry()).toHaveAttribute("readonly");
      expect(chips()).toEqual(["one"]);
    });

    it("disables the entry and the removing", () => {
      render(<TagsInput aria-label="Labels" disabled clearable defaultValue={["one"]} />);
      expect(entry()).toBeDisabled();
      expect(screen.queryByRole("button", { name: "Remove one" })).toBeNull();
      expect(screen.getByRole("group")).toHaveAttribute("aria-disabled", "true");
    });

    it("marks the entry invalid for hasError", () => {
      render(<TagsInput aria-label="Labels" hasError />);
      expect(entry()).toHaveAttribute("aria-invalid", "true");
    });

    it("marks the entry required", () => {
      render(<TagsInput aria-label="Labels" required />);
      expect(entry()).toHaveAttribute("aria-required", "true");
    });

    it("labels the Enter key Done by default, and passes the other phone-keyboard props", () => {
      render(<TagsInput aria-label="Labels" spellCheck={false} autoCapitalize="off" inputMode="email" />);
      expect(entry()).toHaveAttribute("enterkeyhint", "done");
      expect(entry()).toHaveAttribute("spellcheck", "false");
      expect(entry()).toHaveAttribute("autocapitalize", "off");
      expect(entry()).toHaveAttribute("inputmode", "email");
    });
  });

  describe("forms", () => {
    it("submits each tag as its own value under name", () => {
      const { container } = render(
        <form>
          <TagsInput aria-label="Labels" name="labels" defaultValue={["one", "two"]} />
        </form>,
      );
      const form = container.querySelector("form") as HTMLFormElement;
      expect(new FormData(form).getAll("labels")).toEqual(["one", "two"]);
    });

    it("does not submit the typed text: the entry has no name, only the tags do", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <TagsInput aria-label="Labels" name="labels" defaultValue={["one"]} />
        </form>,
      );
      await user.type(entry(), "pending");
      const data = new FormData(container.querySelector("form") as HTMLFormElement);
      expect([...data.keys()]).toEqual(["labels"]);
      expect(data.getAll("labels")).toEqual(["one"]);
    });

    it("stops a form submitting with no tags when required, and focuses the entry", () => {
      const { container } = render(
        <form>
          <TagsInput aria-label="Labels" name="labels" required />
        </form>,
      );
      const form = container.querySelector("form") as HTMLFormElement;
      expect(form.checkValidity()).toBe(false);
      const validity = container.querySelector<HTMLInputElement>("input[aria-hidden=true]") as HTMLInputElement;
      fireEvent.focus(validity);
      expect(entry()).toHaveFocus();
    });
  });

  describe("props and wiring", () => {
    it("forwards ref, id, data-testid and aria to the entry, and className and style to the outer box", () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <TagsInput ref={ref} id="x" data-testid="t" aria-label="Labels" className="mine" style={{ margin: 3 }} />,
      );
      expect(ref.current).toBe(entry());
      expect(entry()).toHaveAttribute("id", "x");
      expect(screen.getByTestId("t")).toBe(entry());
      expect(container.firstElementChild).toHaveClass("mine");
      expect(container.firstElementChild).toHaveStyle({ margin: "3px" });
    });

    it("lets a label focus the entry, and is named by it, inside a FormField", async () => {
      const user = userEvent.setup();
      render(
        <FormField label="Labels" helperText="Press Enter">
          {(fieldProps) => <TagsInput {...fieldProps} defaultValue={["one"]} />}
        </FormField>,
      );
      await user.click(screen.getByText("Labels"));
      expect(entry()).toHaveFocus();
      expect(entry()).toHaveAccessibleName("Labels");
      expect(entry()).toHaveAccessibleDescription(/Press Enter/);
    });

    it("focuses the entry when the box is pressed away from a control", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.click(screen.getByRole("group"));
      expect(entry()).toHaveFocus();
    });

    it("keeps the default of a label whose override is undefined, and uses one that is set", async () => {
      const user = userEvent.setup();
      render(
        <TagsInput
          aria-label="Labels"
          defaultValue={["one"]}
          clearable
          labels={{ remove: (tag) => `Quitar ${tag}`, clear: undefined, added: (tag) => `Añadido ${tag}` }}
        />,
      );
      expect(screen.getByRole("button", { name: "Quitar one" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
      await user.type(entry(), "two{Enter}");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Añadido two"));
    });

    it("writes the numbers in its messages through formatNumber", async () => {
      const user = userEvent.setup();
      render(<TagsInput aria-label="Labels" maxTags={1} defaultValue={["a"]} formatNumber={(n) => `#${n}`} />);
      await user.type(entry(), "b{Enter}");
      expect(screen.getByRole("alert")).toHaveTextContent("No more than #1 tags");
    });

    it("keeps its own role and does not let a same-named attribute replace the group's", () => {
      const { container } = render(
        <TagsInput aria-label="Labels" {...({ role: "presentation", "data-extra": "y" } as object)} />,
      );
      expect(screen.getByRole("group")).toBeInTheDocument();
      expect(container.firstElementChild).toHaveAttribute("data-extra", "y");
    });

    it("renders on the server without touching the document", () => {
      expect(() => renderToString(<TagsInput aria-label="Labels" defaultValue={["one"]} />)).not.toThrow();
    });

    it("survives StrictMode: adds, removes and announces as usual", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <StrictMode>
          <TagsInput aria-label="Labels" onValueChange={onValueChange} />
        </StrictMode>,
      );
      await user.type(entry(), "one{Enter}two{Enter}");
      expect(onValueChange).toHaveBeenCalledTimes(2);
      await user.keyboard("{Backspace}");
      expect(chips()).toEqual(["one"]);
    });
  });

  describe("accessibility", () => {
    it("has no axe violations when empty, filled, refused, read-only and disabled", async () => {
      const user = userEvent.setup();
      const states = [
        <TagsInput key="empty" aria-label="Labels" placeholder="Add" />,
        <TagsInput key="filled" aria-label="Labels" clearable defaultValue={["one", "two"]} />,
        <TagsInput key="readonly" aria-label="Labels" readOnly defaultValue={["one"]} />,
        <TagsInput key="disabled" aria-label="Labels" disabled defaultValue={["one"]} />,
        <TagsInput key="required" aria-label="Labels" required name="labels" />,
      ];
      for (const state of states) {
        const { container, unmount } = render(state);
        expect(await axe(container)).toHaveNoViolations();
        unmount();
      }
      const { container } = render(<TagsInput aria-label="Labels" defaultValue={["one"]} />);
      await user.type(entry(), "one{Enter}");
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
