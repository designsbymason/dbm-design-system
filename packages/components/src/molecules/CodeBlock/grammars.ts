/**
 * The languages `CodeBlock` ships beyond its built-in nine — Python, YAML, SQL, Markdown, Go, Rust and Java — as
 * `CodeLanguage`s an app opts into with `registerCodeLanguage`, so an app that doesn't use one doesn't pay for it.
 * Same engine, same rules of the road (see `tokenize.ts`): sticky expressions in an order, a little state, and
 * two guarantees — every character comes back, and the cost is proportional to the text's length. That second one is
 * why a word is always taken whole and then classified by what follows it, never matched with a lookahead written
 * into its pattern (which retries from every letter of a long word), and why a string or comment that is never closed
 * runs to the end of the text as one match instead of failing and being tried again from the next quote.
 */

import { scan, toLines } from "./engine";
import { MAX_HIGHLIGHT_LENGTH, notAfterWord, wordSet } from "./tokenizeTypes";
import type { CodeLanguage, Rule, State } from "./tokenizeTypes";

interface WordOptions {
  keywords: Set<string>;
  /** `true`, `nil`, `None`: coloured as numbers, the system's colour for values that are words. */
  literals: Set<string>;
  /** Built-in type names. */
  types?: Set<string>;
  /** The keywords that introduce a named definition (`def`, `func`, `fn`): the word after one is a function. */
  definers?: RegExp;
  /** Whether `Name(` is a call (`fmt.Println(`) before it is a type (`Server{`, `Foo(` instantiating a class). */
  callBeforeType?: boolean;
  /** Whether keywords are matched without regard to case (SQL). */
  ignoreCase?: boolean;
}

/** Decides a whole word's type from the word, and from what comes just before and after it. */
function wordClassifier(options: WordOptions): NonNullable<Rule["classify"]> {
  return (text, code, end) => {
    const word = options.ignoreCase ? text.toLowerCase() : text;
    if (options.keywords.has(word)) return "keyword";
    if (options.literals.has(word)) return "number";
    if (options.types?.has(word)) return "type";
    if (options.definers?.test(code.slice(Math.max(0, end - text.length - 12), end - text.length))) return "function";
    const isCall = code[end] === "(";
    const isPascal = /^[A-Z]/.test(text) && /[a-z]/.test(text);
    if (options.callBeforeType) {
      if (isCall) return "function";
      if (isPascal) return "type";
    } else {
      if (isPascal) return "type";
      if (isCall) return "function";
    }
    return undefined;
  };
}

const word = (classify: NonNullable<Rule["classify"]>): Rule => ({ re: /[A-Za-z_][\w$]*/y, classify });

/** Whether only whitespace lies between the start of this line and the position. */
const startsLine = (code: string, position: number) => /(?:^|\n)[ \t]*$/.test(code.slice(Math.max(0, position - 60), position));

// --- Python -------------------------------------------------------------------------------------------------

const pythonRules = (): Rule[] => [
  { re: /#[^\n]*/y, type: "comment" },
  // A decorator: an `@` that starts a statement (an `@` in the middle of one is matrix multiplication).
  { re: /@[A-Za-z_][\w.]*/y, type: "function", when: startsLine },
  {
    // A string with an optional prefix (`r`, `b`, `f`, `rb`…), triple-quoted ones running across lines.
    re: /(?:[rRuUbBfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)/y,
    type: "string",
    when: notAfterWord,
  },
  { re: /0[xX][\da-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[jJ]?/y, type: "number" },
  word(
    wordClassifier({
      keywords: wordSet(
        "and as assert async await break class continue def del elif else except finally for from global if import in is " +
          "lambda nonlocal not or pass raise return try while with yield self cls",
      ),
      literals: wordSet("True False None"),
      types: wordSet("int str float bool list dict set tuple bytes complex object frozenset bytearray"),
    }),
  ),
];

// --- YAML ---------------------------------------------------------------------------------------------------

const leaveLineStart = (_text: string, state: State) => void (state.lineStart = false);
const yamlAfterNewline = (_text: string, state: State) => void (state.lineStart = true);
const atLineStart = (_code: string, _position: number, state: State) => state.lineStart;

const yamlRules = (): Rule[] => [
  { re: /\n/y, after: yamlAfterNewline },
  // Indentation and a list dash leave the line's start open, so `  - key: value` still finds its key.
  { re: /[ \t]+/y },
  { re: /-(?=[ \t]|\n|$)/y, when: atLineStart },
  { re: /(?:---|\.\.\.)(?=[ \t]|\n|$)/y, type: "keyword", when: atLineStart, after: leaveLineStart },
  { re: /#[^\n]*/y, type: "comment", when: (code, position) => position === 0 || /\s/.test(code[position - 1] ?? ""), after: leaveLineStart },
  // A key is found only at the start of a line, once: the lazy match ends at the first colon that ends a key, or at
  // the end of the line, so it costs the line's length and no more.
  { re: /"(?:[^"\\\n]|\\.)*"(?=[ \t]*:(?:[ \t]|\n|$))/y, type: "property", when: atLineStart, after: leaveLineStart },
  { re: /'[^'\n]*'(?=[ \t]*:(?:[ \t]|\n|$))/y, type: "property", when: atLineStart, after: leaveLineStart },
  { re: /[^\s#:{}[\],&*!|>'"%@`-][^\n:#]*?(?=:(?:[ \t]|\n|$))/y, type: "property", when: atLineStart, after: leaveLineStart },
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string", after: leaveLineStart },
  { re: /'[^'\n]*'?/y, type: "string", after: leaveLineStart },
  { re: /[&*][A-Za-z_][\w-]*/y, type: "type", after: leaveLineStart },
  { re: /!{1,2}[\w<>-]*/y, type: "keyword", after: leaveLineStart },
  { re: /[|>][+-]?\d?(?=[ \t]*(?:#|\n|$))/y, type: "keyword", after: leaveLineStart },
  { re: /-?(?:0x[\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/y, type: "number", when: notAfterWord, after: leaveLineStart },
  {
    re: /[A-Za-z_~][\w.~-]*/y,
    classify: (text) => (yamlLiterals.has(text) ? "number" : undefined),
    after: leaveLineStart,
  },
];
const yamlLiterals = /* @__PURE__ */ wordSet("true false null yes no on off True False Null Yes No On Off TRUE FALSE NULL ~");

// --- SQL ----------------------------------------------------------------------------------------------------

const sqlRules = (): Rule[] => [
  { re: /--[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  { re: /'(?:[^']|'')*'?/y, type: "string" },
  // A quoted identifier is a name, not a value.
  { re: /"(?:[^"]|"")*"?/y, type: "property" },
  { re: /`[^`\n]*`?/y, type: "property" },
  { re: /\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?/y, type: "number" },
  // A parameter: `@name`, `$1`, `:name` (but not the `::` of a cast).
  { re: /[@$][A-Za-z_0-9]+|:[A-Za-z_]\w*/y, type: "property", when: (code, position) => code[position - 1] !== ":" },
  word(
    wordClassifier({
      ignoreCase: true,
      keywords: wordSet(
        "select from where and or not in is like ilike between join left right inner outer full cross natural on using " +
          "group by order having limit offset fetch insert into values update set delete create alter drop table index view " +
          "database schema primary key foreign references default unique check constraint as distinct union all except " +
          "intersect exists case when then else end with recursive asc desc returning begin commit rollback transaction " +
          "grant revoke truncate if cascade add column rename to over partition window explain analyze replace temporary " +
          "temp materialized trigger function procedure returns language declare for each row execute",
      ),
      literals: wordSet("true false null"),
      types: wordSet(
        "int integer bigint smallint tinyint varchar char text boolean bool date time timestamp timestamptz interval " +
          "numeric decimal real float double serial bigserial uuid json jsonb bytea blob array money",
      ),
    }),
  ),
];

// --- Markdown -----------------------------------------------------------------------------------------------

const inFence = (_code: string, _position: number, state: State) => state.fence;
const outsideFence = (_code: string, _position: number, state: State) => !state.fence;
const markdownLineStart = (_code: string, _position: number, state: State) => state.lineStart && !state.fence;

const markdownRules = (): Rule[] => [
  { re: /\n/y, after: yamlAfterNewline },
  // A fence's marker line opens or closes the block; the lines between are drawn as they are, so nothing in a
  // snippet of another language is mistaken for Markdown.
  {
    re: /[ \t]{0,3}(?:```|~~~)[^\n]*/y,
    type: "tag",
    when: atLineStart,
    after: (_text, state) => {
      state.fence = !state.fence;
      state.lineStart = false;
    },
  },
  { re: /[^\n]+/y, type: "string", when: inFence },
  { re: /[ \t]+/y, when: outsideFence },
  { re: /#{1,6}(?=[ \t]|\n|$)[^\n]*/y, type: "keyword", when: markdownLineStart, after: leaveLineStart },
  { re: />[^\n]*/y, type: "comment", when: markdownLineStart, after: leaveLineStart },
  { re: /(?:-{3,}|\*{3,}|_{3,})[ \t]*(?=\n|$)/y, type: "comment", when: markdownLineStart, after: leaveLineStart },
  { re: /(?:[-*+]|\d{1,9}[.)])(?=[ \t])/y, type: "keyword", when: markdownLineStart, after: leaveLineStart },
  { re: /<!--[\s\S]*?(?:-->|$)/y, type: "comment", after: leaveLineStart },
  { re: /`[^`\n]+`/y, type: "string", after: leaveLineStart },
  { re: /!?\[[^\]\n]*\]\([^)\n]*\)/y, type: "function", after: leaveLineStart },
  { re: /\*\*[^*\n]+\*\*|__[^_\n]+__/y, type: "type", after: leaveLineStart },
  { re: /<\/?[A-Za-z][^>\n]*>/y, type: "tag", after: leaveLineStart },
];

// --- Go -----------------------------------------------------------------------------------------------------

const goRules = (): Rule[] => [
  { re: /\/\/[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  // A raw string runs across lines.
  { re: /`[^`]*`?/y, type: "string" },
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
  { re: /'(?:[^'\\\n]|\\.)*'?/y, type: "string" },
  { re: /0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?i?/y, type: "number" },
  word(
    wordClassifier({
      keywords: wordSet(
        "break case chan const continue default defer else fallthrough for func go goto if import interface map package " +
          "range return select struct switch type var",
      ),
      literals: wordSet("true false nil iota"),
      types: wordSet(
        "any bool byte comparable complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string " +
          "uint uint8 uint16 uint32 uint64 uintptr",
      ),
      definers: /\bfunc\s+$/,
      callBeforeType: true,
    }),
  ),
];

// --- Rust ---------------------------------------------------------------------------------------------------

const rustRules = (): Rule[] => [
  { re: /\/\/[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  // A raw string ends at a quote and as many `#` as it opened with; one never closed runs to the end.
  { re: /b?r(#*)"[\s\S]*?(?:"\1|$)/y, type: "string", when: notAfterWord },
  { re: /b?"(?:[^"\\]|\\[\s\S])*"?/y, type: "string", when: notAfterWord },
  // A character (`'a'`, `'\\n'`) or, failing that, a lifetime (`'a`, `'static`).
  { re: /b?'(?:\\(?:x[\da-fA-F]{2}|u\{[\da-fA-F_]{1,6}\}|.)|[^'\\\n])'/y, type: "string", when: notAfterWord },
  { re: /'[A-Za-z_]\w*/y, type: "type" },
  { re: /#!?\[[^\]\n]*\]/y, type: "tag" },
  {
    re: /0x[\da-fA-F_]+|0o[0-7_]+|0b[01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?(?:[iu](?:8|16|32|64|128|size)|f32|f64)?/y,
    type: "number",
  },
  // A macro call: `println!(`, `vec![`.
  { re: /[A-Za-z_]\w*!(?=[([{])/y, type: "function" },
  word(
    wordClassifier({
      keywords: wordSet(
        "as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub " +
          "ref return self Self static struct super trait type unsafe use where while",
      ),
      literals: wordSet("true false"),
      types: wordSet("i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str"),
      definers: /\bfn\s+$/,
    }),
  ),
];

// --- Java ---------------------------------------------------------------------------------------------------

const javaRules = (): Rule[] => [
  { re: /\/\/[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  { re: /"""[\s\S]*?(?:"""|$)/y, type: "string" },
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
  { re: /'(?:[^'\\\n]|\\.)*'?/y, type: "string" },
  { re: /@[A-Za-z_][\w.]*/y, type: "function", when: notAfterWord },
  { re: /0[xX][\da-fA-F_]+[lL]?|0[bB][01_]+[lL]?|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[lLfFdD]?/y, type: "number" },
  word(
    wordClassifier({
      keywords: wordSet(
        "abstract assert break case catch class const continue default do else enum extends final finally for goto if " +
          "implements import instanceof interface native new package private protected public return static strictfp " +
          "super switch synchronized this throw throws transient try void volatile while var record sealed permits yield",
      ),
      literals: wordSet("true false null"),
      types: wordSet("boolean byte char double float int long short"),
    }),
  ),
];

const language = (name: string, aliases: string[], rules: () => Rule[]): CodeLanguage => {
  let built: Rule[] | undefined;
  return {
    name,
    aliases,
    maxLength: MAX_HIGHLIGHT_LENGTH,
    // The rules are built on first use, so importing a language costs nothing until a block draws it.
    tokenize: (code) => toLines(scan(code, (built ??= rules()))),
  };
};

// Each is a single, marked-pure call, so a bundler drops the ones an app doesn't import.
/** Python, for `registerCodeLanguage`. Also `py` and `python3`. */
export const pythonLanguage: CodeLanguage = /* @__PURE__ */ language("python", ["py", "python3"], pythonRules);
/** YAML, for `registerCodeLanguage`. Also `yml`. */
export const yamlLanguage: CodeLanguage = /* @__PURE__ */ language("yaml", ["yml"], yamlRules);
/** SQL, for `registerCodeLanguage`. Also `postgresql`, `postgres`, `pgsql`, `mysql` and `sqlite`. */
export const sqlLanguage: CodeLanguage = /* @__PURE__ */ language("sql", ["postgresql", "postgres", "pgsql", "mysql", "sqlite"], sqlRules);
/** Markdown, for `registerCodeLanguage`. Also `md`. */
export const markdownLanguage: CodeLanguage = /* @__PURE__ */ language("markdown", ["md"], markdownRules);
/** Go, for `registerCodeLanguage`. Also `golang`. */
export const goLanguage: CodeLanguage = /* @__PURE__ */ language("go", ["golang"], goRules);
/** Rust, for `registerCodeLanguage`. Also `rs`. */
export const rustLanguage: CodeLanguage = /* @__PURE__ */ language("rust", ["rs"], rustRules);
/** Java, for `registerCodeLanguage`. */
export const javaLanguage: CodeLanguage = /* @__PURE__ */ language("java", [], javaRules);
