import { afterEach, describe, expect, it, vi } from "vitest";
import { cLanguage, cppLanguage, csharpLanguage, goLanguage, javaLanguage, kotlinLanguage, markdownLanguage, phpLanguage, pythonLanguage, rubyLanguage, rustLanguage, sqlLanguage, swiftLanguage, tomlLanguage, yamlLanguage } from "./grammars";
import { optInLanguageExports } from "./optInLanguages";
import { findRegisteredLanguage, registerCodeLanguage, subscribeToCodeLanguages } from "./registry";
import { MAX_HIGHLIGHT_LENGTH, tokenize } from "./tokenize";
import type { CodeLanguage, Highlighter, TokenLine } from "./tokenizeTypes";

const typed = (code: string, language: string, highlighter?: Highlighter) =>
  tokenize(code, language, highlighter)
    .flat()
    .filter((token) => token.type)
    .map((token) => [token.type, token.text]);

const pythonCode = "def total(items):\n    return None";
const plain = (code: string): TokenLine[] => code.split("\n").map((text) => (text ? [{ text }] : []));

// A language of an app's own: every word is a keyword.
const shout: CodeLanguage = {
  name: "shout",
  aliases: ["yell"],
  tokenize: (code) => code.split("\n").map((line) => (line ? [{ type: "keyword" as const, text: line }] : [])),
};

const undo: Array<() => void> = [];
const register = (language: CodeLanguage) => {
  const unregister = registerCodeLanguage(language);
  undo.push(unregister);
  return unregister;
};
afterEach(() => {
  while (undo.length) undo.pop()?.();
  vi.restoreAllMocks();
});

describe("the languages that ship outside the core", () => {
  it("are plain text until an app registers them, and coloured after", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(typed(pythonCode, "python")).toEqual([]);
    expect(tokenize(pythonCode, "python")).toEqual(plain(pythonCode));
    const unregister = register(pythonLanguage);
    expect(typed(pythonCode, "python").map(([type]) => type)).toContain("keyword");
    unregister();
    expect(typed(pythonCode, "python")).toEqual([]);
  });

  it("answer to every alias they had when they were built in, in any case", () => {
    const aliases: Array<[CodeLanguage, string[]]> = [
      [pythonLanguage, ["python", "py", "python3", "Python"]],
      [yamlLanguage, ["yaml", "yml"]],
      [sqlLanguage, ["sql", "postgresql", "postgres", "pgsql", "mysql", "sqlite"]],
      [markdownLanguage, ["markdown", "md"]],
      [goLanguage, ["go", "golang"]],
      [rustLanguage, ["rust", "rs"]],
      [javaLanguage, ["java"]],
      [cLanguage, ["c", "h"]],
      [cppLanguage, ["cpp", "c++", "cc", "cxx", "hpp", "hh"]],
      [csharpLanguage, ["csharp", "cs", "c#"]],
      [kotlinLanguage, ["kotlin", "kt", "kts"]],
      [swiftLanguage, ["swift"]],
      [rubyLanguage, ["ruby", "rb"]],
      [phpLanguage, ["php"]],
      [tomlLanguage, ["toml"]],
    ];
    for (const [language] of aliases) register(language);
    for (const [language, names] of aliases) {
      for (const name of names) expect(findRegisteredLanguage(` ${name} `), name).toBe(language);
    }
  });

  it("carry the size limit the built-in languages have", () => {
    register(pythonLanguage);
    const large = `x = 1\n${"y = 2\n".repeat(MAX_HIGHLIGHT_LENGTH / 6)}`;
    expect(large.length).toBeGreaterThan(MAX_HIGHLIGHT_LENGTH);
    expect(typed(large, "python")).toEqual([]);
    expect(typed(large.slice(0, MAX_HIGHLIGHT_LENGTH - 10), "python").length).toBeGreaterThan(0);
  });
});

describe("registerCodeLanguage", () => {
  it("teaches a language of an app's own, by name and alias", () => {
    register(shout);
    expect(typed("hello", "shout")).toEqual([["keyword", "hello"]]);
    expect(typed("hello", "YELL")).toEqual([["keyword", "hello"]]);
  });

  it("puts a registered language ahead of a built-in one, and gives the built-in one back when it is undone", () => {
    const unregister = register({ name: "ts", tokenize: shout.tokenize });
    expect(typed("const a = 1;", "ts")).toEqual([["keyword", "const a = 1;"]]);
    unregister();
    expect(typed("const a = 1;", "ts").map(([type]) => type)).toEqual(["keyword", "number"]);
  });

  it("replaces a language registered under the same name, and undoing the old one leaves the new one", () => {
    const first = register({ name: "shout", tokenize: () => [[{ type: "string", text: "one" }]] });
    register({ name: "shout", tokenize: () => [[{ type: "number", text: "two" }]] });
    expect(typed("two", "shout")).toEqual([["number", "two"]]);
    first();
    expect(typed("two", "shout")).toEqual([["number", "two"]]);
  });

  it("throws, saying what is missing, for something that is not a language", () => {
    for (const bad of [undefined, null, "python", {}, { name: "" }, { name: "  ", tokenize: () => [] }, { name: "x" }, { tokenize: () => [] }]) {
      expect(() => registerCodeLanguage(bad as never)).toThrow(/name.*tokenize/);
    }
  });

  it("ignores an alias that is not a usable string", () => {
    register({ name: "odd", aliases: ["", 4 as never, "fine"], tokenize: shout.tokenize });
    expect(findRegisteredLanguage("fine")?.name).toBe("odd");
    expect(findRegisteredLanguage("4")).toBeUndefined();
    expect(findRegisteredLanguage("")).toBeUndefined();
  });

  it("tells subscribers, and only when something changed", () => {
    const listener = vi.fn();
    const stop = subscribeToCodeLanguages(listener);
    const unregister = register(shout);
    expect(listener).toHaveBeenCalledTimes(1);
    unregister();
    expect(listener).toHaveBeenCalledTimes(2);
    unregister(); // already undone: nothing to announce
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    register(shout);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("knows no language for a name that is not a string", () => {
    expect(findRegisteredLanguage(undefined)).toBeUndefined();
    expect(findRegisteredLanguage(7 as never)).toBeUndefined();
  });
});

describe("a language's own size limit", () => {
  const big = "word ".repeat(MAX_HIGHLIGHT_LENGTH / 4);

  it("is not imposed on a language with none, whose cost is its own", () => {
    const run = vi.fn(shout.tokenize);
    register({ name: "shout", tokenize: run });
    expect(tokenize(big, "shout")[0]?.[0]?.type).toBe("keyword");
    expect(run).toHaveBeenCalledOnce();
  });

  it("draws the text plain, without calling the language, past the limit it names", () => {
    const run = vi.fn(shout.tokenize);
    register({ name: "shout", maxLength: 100, tokenize: run });
    expect(tokenize("x".repeat(101), "shout")).toEqual(plain("x".repeat(101)));
    expect(run).not.toHaveBeenCalled();
    expect(tokenize("x".repeat(100), "shout")[0]?.[0]?.type).toBe("keyword");
  });

  it("is not imposed on a block's own highlighter", () => {
    const highlighter: Highlighter = (code) => code.split("\n").map((text) => [{ type: "string" as const, text }]);
    expect(tokenize(big, "anything", highlighter)[0]?.[0]?.type).toBe("string");
  });
});

describe("a block's own highlighter", () => {
  const upper: Highlighter = (code) => code.split("\n").map((text) => (text ? [{ type: "type" as const, text }] : []));

  it("takes over from a registered and a built-in language", () => {
    register(shout);
    expect(typed("hi", "shout", upper)).toEqual([["type", "hi"]]);
    expect(typed("const a", "ts", upper)).toEqual([["type", "const a"]]);
  });

  it("is given the text as it is drawn and the language as written", () => {
    const seen = vi.fn(() => undefined);
    tokenize("a\r\nb\n", "  TS ", seen);
    expect(seen).toHaveBeenCalledWith("a\nb", "  TS ");
  });

  it("leaves the block to the registered and built-in languages by returning undefined, without a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    register(shout);
    expect(typed("hi", "shout", () => undefined)).toEqual([["keyword", "hi"]]);
    expect(typed("const a", "ts", () => undefined).map(([type]) => type)).toEqual(["keyword"]);
    expect(warn).not.toHaveBeenCalled();
    // A warning is said once per message, so the check that declining is silent uses a name nothing else has warned about.
    register({ name: "declines", tokenize: () => undefined as never });
    expect(tokenize("a", "declines")).toEqual(plain("a"));
    expect(warn).not.toHaveBeenCalled();
  });

  it("is ignored when it is not a function", () => {
    expect(typed("const a", "ts", "nope" as never).map(([type]) => type)).toEqual(["keyword"]);
  });
});

describe("what a highlighter or language returns is checked", () => {
  const code = "one\ntwo";
  const bad: Array<[string, () => unknown]> = [
    ["drops a character", () => [[{ text: "on" }], [{ text: "two" }]]],
    ["adds a character", () => [[{ text: "one!" }], [{ text: "two" }]]],
    ["changes a character", () => [[{ text: "one" }], [{ text: "twp" }]]],
    ["puts a newline in a token", () => [[{ text: "one\ntwo" }]]],
    ["has the wrong number of lines", () => [[{ text: "one" }], [{ text: "two" }], []]],
    ["merges the lines", () => [[{ text: "onetwo" }]]],
    ["returns no lines", () => []],
    ["returns something that is not an array", () => "one\ntwo"],
    ["returns a line that is not an array", () => ["one", "two"]],
    ["returns a number", () => 5],
    ["returns an object", () => ({ length: 2 })],
    ["returns null", () => null],
    ["returns lines that are numbers", () => [5, 6]],
    ["returns lines that are objects", () => [{}, {}]],
    ["returns a token with no text", () => [[{ type: "keyword" }], [{ text: "two" }]]],
    ["returns a token that is not an object", () => [[null], [{ text: "two" }]]],
    ["throws", () => { throw new Error("boom"); }],
  ];

  it.each(bad)("draws the code plain, keeping it whole, when a highlighter %s", (_name, run) => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(tokenize(code, "ts", run as Highlighter)).toEqual(tokenize(code, "cobol"));
  });

  it.each(bad)("does the same when a registered language %s", (_name, run) => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    register({ name: "faulty", tokenize: run as CodeLanguage["tokenize"] });
    expect(tokenize(code, "faulty")).toEqual(plain(code));
  });

  it("falls back to the registered language, then the built-in, when a highlighter is faulty", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    register(shout);
    expect(typed("hi", "shout", () => [[{ text: "no" }]])).toEqual([["keyword", "hi"]]);
    expect(typed("const a", "ts", () => [[{ text: "no" }]]).map(([type]) => type)).toEqual(["keyword"]);
  });

  it("says why, once per reason, in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    register({ name: "faulty-once", tokenize: () => [[{ text: "x" }]] });
    tokenize("a", "faulty-once");
    tokenize("b", "faulty-once");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/faulty-once.*join back to the code/);
    const thrown = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    tokenize("a", "ts", () => { throw new Error("boom-unique"); });
    expect(thrown.mock.calls.at(-1)?.[0]).toMatch(/threw \(boom-unique\)/);
  });

  it("stays silent in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    register({ name: "faulty-in-production", tokenize: () => [[{ text: "x" }]] });
    vi.stubEnv("NODE_ENV", "production");
    tokenize("a", "faulty-in-production");
    vi.unstubAllEnvs();
    expect(warn).not.toHaveBeenCalled();
    // (the same fault in development does warn: a name no other test has used, so it hasn't been said before)
    tokenize("a", "faulty-in-production");
    expect(warn).toHaveBeenCalledOnce();
  });

  it("copies what it accepts, so what it returns cannot reach the page's class names", () => {
    const tokens = tokenize("ab", "x", () => [
      [
        { type: "constructor" as never, text: "a" },
        { type: "__proto__" as never, text: "" },
        { type: "keyword", text: "b", extra: "ignored" } as never,
      ],
    ]);
    expect(tokens).toEqual([[{ text: "a" }, { type: "keyword", text: "b" }]]);
  });

  it("draws empty text as one empty line, not none, whatever a highlighter returns for it", () => {
    expect(tokenize("", "x", () => [])).toEqual([[]]);
  });

  it("accepts an empty line as an empty array and an empty text", () => {
    expect(tokenize("", "x", () => [[]])).toEqual([[]]);
    expect(tokenize("a\n\nb", "x", (code) => code.split("\n").map((text) => (text ? [{ text }] : [])))).toEqual([[{ text: "a" }], [], [{ text: "b" }]]);
  });
});

describe("cost", () => {
  it("of checking a large result is proportional to its length", () => {
    const large = "a\n".repeat(200_000);
    const start = performance.now();
    tokenize(large, "x", (code) => code.split("\n").map((text) => (text ? [{ text }] : [])));
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe("an opt-in language nobody registered", () => {
  const shipped = { pythonLanguage, yamlLanguage, sqlLanguage, markdownLanguage, goLanguage, rustLanguage, javaLanguage, cLanguage, cppLanguage, csharpLanguage, kotlinLanguage, swiftLanguage, rubyLanguage, phpLanguage, tomlLanguage };

  // Spellings in capitals: a warning is said once per message, and the tests above use the lower-case ones.
  it.each(Object.entries(optInLanguageExports))("says, in development, how to turn on %s", (name, exportName) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const spelled = ` ${name.toUpperCase()} `;
    expect(tokenize("code", spelled)).toEqual(plain("code"));
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain(`language "${spelled.trim()}"`);
    expect(warn.mock.calls[0]?.[0]).toContain(`registerCodeLanguage(${exportName})`);
  });

  it("says nothing once it is registered, or when the block highlights itself", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    register(pythonLanguage);
    tokenize("x = 1", "PyThOn3");
    tokenize("x = 1", "Rs", () => [[{ text: "x = 1" }]]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("says nothing for a built-in language, an unknown one, or a value that is not a string", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    for (const language of ["tsx", "bash", "cobol", "constructor", "__proto__", "toString", "", undefined, 7, {}]) {
      tokenize("x", language as never);
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("says nothing in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubEnv("NODE_ENV", "production");
    tokenize("x", "SQLITE");
    vi.unstubAllEnvs();
    expect(warn).not.toHaveBeenCalled();
  });

  it("still draws the code, whole", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(tokenize("a\nb", "MYSQL")).toEqual(plain("a\nb"));
  });

  it("is held to the languages that ship: every name they answer to, and no other", () => {
    const fromGrammars: Record<string, string> = {};
    for (const [exportName, language] of Object.entries(shipped)) {
      for (const name of [language.name, ...(language.aliases ?? [])]) fromGrammars[name] = exportName;
    }
    expect(optInLanguageExports).toEqual(fromGrammars);
  });
});
