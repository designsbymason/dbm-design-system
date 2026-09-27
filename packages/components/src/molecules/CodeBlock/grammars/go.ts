import { defineLanguage, word, wordClassifier } from "./kit";
import { wordSet } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

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

/** Go, for `registerCodeLanguage`. Also `golang`. */
export const goLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("go", ["golang"], goRules);
