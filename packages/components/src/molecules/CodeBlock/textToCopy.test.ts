import { describe, expect, it } from "vitest";
import { textToCopy } from "./textToCopy";

describe("textToCopy", () => {
  it("takes a leading $ prompt off each line that has one, in shell code", () => {
    expect(textToCopy("$ pnpm add x\n$ pnpm test", "bash", true)).toBe("pnpm add x\npnpm test");
  });

  it("keeps indentation, and lines without a prompt exactly as they are", () => {
    expect(textToCopy("# install\n  $ npm i\nif true; then\n$ echo hi\nfi", "sh", true)).toBe("# install\n  npm i\nif true; then\necho hi\nfi");
  });

  it("only counts a $ followed by a space", () => {
    expect(textToCopy("$HOME/bin\n$(pwd)\n$$\n$", "bash", true)).toBe("$HOME/bin\n$(pwd)\n$$\n$");
    expect(textToCopy("echo $ x", "bash", true)).toBe("echo $ x");
  });

  it("takes only the first prompt of a line, and works with Windows line endings", () => {
    expect(textToCopy("$ echo '$ x'", "bash", true)).toBe("echo '$ x'");
    expect(textToCopy("$ a\r\n$ b", "shell", true)).toBe("a\r\nb");
  });

  it("copies the code unchanged when told not to, and for any other language", () => {
    expect(textToCopy("$ pnpm add x", "bash", false)).toBe("$ pnpm add x");
    expect(textToCopy("$ x = 1", "ts", true)).toBe("$ x = 1");
    expect(textToCopy("$ x", undefined, true)).toBe("$ x");
    expect(textToCopy("$ x", "", true)).toBe("$ x");
  });

  it("knows the shell aliases, in any case", () => {
    for (const language of ["bash", "sh", "shell", "zsh", "console", "BASH"]) expect(textToCopy("$ x", language, true)).toBe("x");
  });
});
