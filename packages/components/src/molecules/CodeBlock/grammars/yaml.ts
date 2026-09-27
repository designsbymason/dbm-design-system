import { atLineStart, defineLanguage, leaveLineStart, startLineAfterNewline, wordSet } from "./kit";
import { notAfterWord } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const yamlRules = (): Rule[] => [
  { re: /\n/y, after: startLineAfterNewline },
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

/** YAML, for `registerCodeLanguage`. Also `yml`. */
export const yamlLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("yaml", ["yml"], yamlRules);
