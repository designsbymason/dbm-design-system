import { atLineStart, defineLanguage, leaveLineStart, startLineAfterNewline } from "./kit";
import { notAfterWord, wordSet } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const tomlLiterals = /* @__PURE__ */ wordSet("true false inf nan");

const tomlRules = (): Rule[] => [
  { re: /\n/y, after: startLineAfterNewline },
  // Indentation leaves the line's start open, so an indented key is still found.
  { re: /[ \t]+/y },
  { re: /#[^\n]*/y, type: "comment" },
  // A table header, `[server]` or `[[servers]]`, on its own at the start of a line (an inline array like `[1, 2]` has
  // characters a header does not, and the brackets may not nest, so an unclosed one fails at the next `[`).
  { re: /\[\[?[\w.\-" '\t]+\]\]?/y, type: "tag", when: atLineStart, after: leaveLineStart },
  // A key is found only at the start of a line, once: a dotted bare key, or a quoted one, followed by `=`.
  { re: /[\w-]+(?:[ \t]*\.[ \t]*[\w-]+)*(?=[ \t]*=)/y, type: "property", when: atLineStart, after: leaveLineStart },
  { re: /"(?:[^"\\\n]|\\.)*"(?=[ \t]*=)/y, type: "property", when: atLineStart, after: leaveLineStart },
  { re: /'[^'\n]*'(?=[ \t]*=)/y, type: "property", when: atLineStart, after: leaveLineStart },
  { re: /"""[\s\S]*?(?:"""|$)/y, type: "string", after: leaveLineStart },
  { re: /'''[\s\S]*?(?:'''|$)/y, type: "string", after: leaveLineStart },
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string", after: leaveLineStart },
  { re: /'[^'\n]*'?/y, type: "string", after: leaveLineStart },
  // Dates and times, then numbers.
  {
    re: /\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})?)?|\d{2}:\d{2}:\d{2}(?:\.\d+)?/y,
    type: "number",
    when: notAfterWord,
    after: leaveLineStart,
  },
  // A number, with an optional sign; `inf` and `nan` carry one too (`-inf`), and are coloured bare by the word rule.
  { re: /[+-](?:inf|nan)(?![\w-])|[+-]?(?:0x[\da-fA-F_]+|0o[0-7_]+|0b[01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)/y, type: "number", when: notAfterWord, after: leaveLineStart },
  { re: /[A-Za-z_][\w-]*/y, classify: (text) => (tomlLiterals.has(text) ? "number" : undefined), after: leaveLineStart },
];

/** TOML, for `registerCodeLanguage`. */
export const tomlLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("toml", "TOML", [], tomlRules);
