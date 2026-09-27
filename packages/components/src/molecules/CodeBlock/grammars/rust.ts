import { defineLanguage, word, wordClassifier } from "./kit";
import { notAfterWord, wordSet } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const rustRules = (): Rule[] => [
  { re: /\/\/[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  // A raw string ends at a quote and as many `#` as it opened with; one never closed runs to the end.
  { re: /b?r(#*)"[\s\S]*?(?:"\1|$)/y, type: "string", when: notAfterWord },
  { re: /b?"(?:[^"\\]|\\[\s\S])*"?/y, type: "string", when: notAfterWord },
  // A character (`'a'`, `'\\n'`) or, failing that, a lifetime (`'a`, `'static`).
  { re: /b?'(?:\\(?:x[\da-fA-F]{2}|u\{[\da-fA-F_]{1,6}\}|.)|[^'\\\n])'/y, type: "string", when: notAfterWord },
  { re: /'[A-Za-z_]\w*/y, type: "type" },
  // An attribute stops at the next `[`, so `#[` repeated and never closed is not read to the line's end every time.
  { re: /#!?\[[^[\]\n]*\]/y, type: "tag" },
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

/** Rust, for `registerCodeLanguage`. Also `rs`. */
export const rustLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("rust", "Rust", ["rs"], rustRules);
